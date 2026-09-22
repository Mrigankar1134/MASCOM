package com.mascom.app.ui.screens.product

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.mascom.app.domain.model.BagLine
import com.mascom.app.domain.model.Product
import com.mascom.app.domain.repository.BagRepository
import com.mascom.app.domain.repository.ShopRepository
import com.mascom.app.ui.navigation.ProductRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProductSelection(
    val variantIndex: Int = 0,
    val size: String? = null,
    val customName: String = "",
    val quantity: Int = 1,
    val sizeMissing: Boolean = false,
)

data class ProductUiState(
    val product: Product? = null,
    val loading: Boolean = true,
    val selection: ProductSelection = ProductSelection(),
    val bagCount: Int = 0,
) {
    val variant get() = product?.variants?.getOrNull(selection.variantIndex)
    val images get() = variant?.images?.takeIf { it.isNotEmpty() } ?: listOfNotNull(product?.cover)
}

enum class ProductEvent { Added, NeedSize }

@HiltViewModel
class ProductViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val shop: ShopRepository,
    private val bag: BagRepository,
) : ViewModel() {

    private val route = savedState.toRoute<ProductRoute>()
    private val selection = MutableStateFlow(ProductSelection(variantIndex = route.variant))
    private val loading = MutableStateFlow(true)

    private val _events = Channel<ProductEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    val state: StateFlow<ProductUiState> = combine(
        shop.product(route.slug),
        selection,
        loading,
        bag.lines.map { lines -> lines.sumOf { it.quantity } },
    ) { product, sel, isLoading, bagCount ->
        val safeSel = if (product != null && sel.variantIndex >= product.variants.size) sel.copy(variantIndex = 0) else sel
        ProductUiState(product, isLoading && product == null, safeSel, bagCount)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ProductUiState(selection = selection.value))

    init {
        viewModelScope.launch {
            // Opened from a link or notification before the shop ever loaded: fetch the catalogue.
            if (shop.product(route.slug).first() == null) shop.refresh()
            loading.value = false
        }
    }

    fun selectVariant(index: Int) = selection.update { it.copy(variantIndex = index) }
    fun selectSize(size: String) = selection.update { it.copy(size = size, sizeMissing = false) }
    fun setCustomName(name: String) = selection.update { it.copy(customName = name.take(24)) }
    fun setQuantity(quantity: Int) = selection.update { it.copy(quantity = quantity.coerceIn(1, BagLine.MAX_QUANTITY)) }

    fun addToBag() {
        val current = state.value
        val product = current.product ?: return
        val sel = current.selection
        if (product.sizes.isNotEmpty() && sel.size == null) {
            selection.update { it.copy(sizeMissing = true) }
            _events.trySend(ProductEvent.NeedSize)
            return
        }
        viewModelScope.launch {
            bag.add(product, current.variant?.color, sel.size, sel.customName, sel.quantity)
            selection.update { it.copy(quantity = 1) }
            _events.send(ProductEvent.Added)
        }
    }
}
