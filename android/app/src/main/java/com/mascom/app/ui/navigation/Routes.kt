package com.mascom.app.ui.navigation

import kotlinx.serialization.Serializable

/** The first-run welcome. [replay] is set when reopened from You, so "Get started" just goes back. */
@Serializable data class WelcomeRoute(val replay: Boolean = false)
@Serializable data object ShopRoute
@Serializable data object BagRoute
@Serializable data object OrdersRoute
@Serializable data object AccountRoute
@Serializable data object ConsoleRoute

/**
 * [id], [cover] and [variant] let the product page draw the tapped photo on its very first frame,
 * so the shared-element transition from the shop grid has something to land on.
 */
@Serializable data class ProductRoute(
    val slug: String,
    val id: String = "",
    val cover: String? = null,
    val variant: Int = 0,
)
@Serializable data object CheckoutRoute
@Serializable data class OrderRoute(val id: String, val placed: Boolean = false)
@Serializable data class AuthRoute(val signUp: Boolean = false)
@Serializable data object EditProfileRoute
@Serializable data object AboutRoute
@Serializable data object GalleryRoute
