package com.mascom.app.ui.screens.orders

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.mascom.app.domain.model.Order
import com.mascom.app.domain.model.User
import com.mascom.app.domain.repository.AuthRepository
import com.mascom.app.domain.repository.OrderRepository
import com.mascom.app.ui.navigation.OrderRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChangedBy
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class Loadable<T>(val data: T? = null, val loading: Boolean = false, val error: String? = null)

data class OrdersUiState(val user: User?, val orders: Loadable<List<Order>>)

@HiltViewModel
class OrdersViewModel @Inject constructor(
    private val repo: OrderRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val orders = MutableStateFlow(Loadable<List<Order>>(loading = true))

    val state: StateFlow<OrdersUiState> = combine(auth.user, orders) { user, list -> OrdersUiState(user, list) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), OrdersUiState(auth.user.value, Loadable(loading = true)))

    init {
        // Reload whenever someone signs in or out.
        viewModelScope.launch {
            auth.user.distinctUntilChangedBy { it?.id }.collect { if (it != null) refresh() else orders.value = Loadable() }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            orders.update { it.copy(loading = true, error = null) }
            repo.orders()
                .onSuccess { list -> orders.value = Loadable(list) }
                .onFailure { e -> orders.update { it.copy(loading = false, error = e.message) } }
        }
    }
}

@HiltViewModel
class OrderDetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: OrderRepository,
) : ViewModel() {
    private val id = savedState.toRoute<OrderRoute>().id
    private val _state = MutableStateFlow(Loadable<Order>(loading = true))
    val state: StateFlow<Loadable<Order>> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            repo.order(id)
                .onSuccess { _state.value = Loadable(it) }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message) } }
        }
    }
}
