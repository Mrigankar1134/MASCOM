package com.mascom.app.ui.screens.console

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mascom.app.domain.model.ConsoleStats
import com.mascom.app.domain.model.Order
import com.mascom.app.domain.model.PaymentStatus
import com.mascom.app.domain.repository.ConsoleRepository
import com.mascom.app.ui.screens.orders.Loadable
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class ConsoleTab { Overview, Verify }

data class ConsoleUiState(
    val tab: ConsoleTab = ConsoleTab.Verify,
    val stats: Loadable<ConsoleStats> = Loadable(loading = true),
    val queue: Loadable<List<Order>> = Loadable(loading = true),
    val filter: PaymentStatus? = PaymentStatus.Pending,
    val query: String = "",
    /** Orders with a verification call in flight, so their buttons can spin. */
    val busy: Set<String> = emptySet(),
    val message: String? = null,
)

@OptIn(FlowPreview::class)
@HiltViewModel
class ConsoleViewModel @Inject constructor(private val repo: ConsoleRepository) : ViewModel() {

    private val _state = MutableStateFlow(ConsoleUiState())
    val state = _state.asStateFlow()
    private val query = MutableStateFlow("")
    private var queueJob: Job? = null

    init {
        refresh()
        viewModelScope.launch { query.drop(1).debounce(350).collect { loadQueue() } }
    }

    fun refresh() {
        loadStats()
        loadQueue()
    }

    fun setTab(tab: ConsoleTab) = _state.update { it.copy(tab = tab) }

    fun setFilter(status: PaymentStatus?) {
        _state.update { it.copy(filter = status) }
        loadQueue()
    }

    fun setQuery(value: String) {
        _state.update { it.copy(query = value) }
        query.value = value
    }

    fun dismissMessage() = _state.update { it.copy(message = null) }

    fun setPayment(order: Order, status: PaymentStatus, notes: String? = null) {
        viewModelScope.launch {
            _state.update { it.copy(busy = it.busy + order.id) }
            repo.setPayment(order.id, status, notes)
                .onSuccess {
                    _state.update { s ->
                        val list = s.queue.data.orEmpty().mapNotNull { o ->
                            when {
                                o.id != order.id -> o
                                // Drop it from a filtered view it no longer belongs to.
                                s.filter != null && s.filter != status -> null
                                else -> o.copy(paymentStatus = status)
                            }
                        }
                        s.copy(queue = s.queue.copy(data = list), message = "${order.orderId} marked ${status.wire.lowercase()}")
                    }
                    loadStats()
                }
                .onFailure { e -> _state.update { it.copy(message = e.message) } }
            _state.update { it.copy(busy = it.busy - order.id) }
        }
    }

    private fun loadStats() {
        viewModelScope.launch {
            _state.update { it.copy(stats = it.stats.copy(loading = true, error = null)) }
            repo.stats()
                .onSuccess { stats -> _state.update { it.copy(stats = Loadable(stats)) } }
                .onFailure { e -> _state.update { it.copy(stats = it.stats.copy(loading = false, error = e.message)) } }
        }
    }

    private fun loadQueue() {
        queueJob?.cancel()
        queueJob = viewModelScope.launch {
            val s = _state.value
            _state.update { it.copy(queue = it.queue.copy(loading = true, error = null)) }
            repo.queue(s.filter, s.query)
                .onSuccess { list -> _state.update { it.copy(queue = Loadable(list)) } }
                .onFailure { e -> _state.update { it.copy(queue = it.queue.copy(loading = false, error = e.message)) } }
        }
    }
}
