package com.mascom.app.ui.screens.shop

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mascom.app.domain.model.Product
import com.mascom.app.domain.model.User
import com.mascom.app.domain.repository.AuthRepository
import com.mascom.app.domain.repository.ShopRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ShopUiState(
    val products: List<Product> = emptyList(),
    val user: User? = null,
    val category: String? = null,
    val refreshing: Boolean = false,
    val loadedOnce: Boolean = false,
    val error: String? = null,
) {
    /** The drop that is open for orders right now, if any (drives the hero line). */
    val openDrop get() = products.firstOrNull { it.canOrder }

    val categories get() = products.mapNotNull { it.category?.takeIf(String::isNotBlank) }.distinct()

    val visible get() = if (category == null) products else products.filter { it.category == category }
}

private data class Status(val refreshing: Boolean = false, val loaded: Boolean = false, val error: String? = null)

@HiltViewModel
class ShopViewModel @Inject constructor(
    private val shop: ShopRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val status = MutableStateFlow(Status(refreshing = true))
    private val category = MutableStateFlow<String?>(null)

    val state: StateFlow<ShopUiState> =
        combine(shop.products, auth.user, status, category) { products, user, s, cat ->
            ShopUiState(products, user, cat?.takeIf { c -> products.any { it.category == c } }, s.refreshing, s.loaded, s.error)
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ShopUiState(refreshing = true))

    init {
        refresh()
    }

    fun selectCategory(value: String?) {
        category.value = value
    }

    fun refresh() {
        viewModelScope.launch {
            status.update { it.copy(refreshing = true, error = null) }
            val result = shop.refresh()
            status.value = Status(refreshing = false, loaded = true, error = result.exceptionOrNull()?.message)
        }
    }
}
