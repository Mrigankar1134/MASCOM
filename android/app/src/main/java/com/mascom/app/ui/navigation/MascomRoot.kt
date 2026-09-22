package com.mascom.app.ui.navigation

import androidx.compose.animation.AnimatedContentScope
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.ExperimentalSharedTransitionApi
import androidx.compose.animation.SharedTransitionLayout
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
import androidx.compose.material.icons.automirrored.rounded.ReceiptLong
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material.icons.rounded.Dashboard
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.ShoppingBag
import androidx.compose.material.icons.rounded.Storefront
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavDestination
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import com.mascom.app.domain.model.User
import com.mascom.app.ui.AppViewModel
import com.mascom.app.ui.components.LocalNavAnimatedScope
import com.mascom.app.ui.components.LocalSharedTransitionScope
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.screens.about.AboutScreen
import com.mascom.app.ui.screens.about.GalleryScreen
import com.mascom.app.ui.screens.account.AccountScreen
import com.mascom.app.ui.screens.account.EditProfileScreen
import com.mascom.app.ui.screens.auth.AuthScreen
import com.mascom.app.ui.screens.bag.BagScreen
import com.mascom.app.ui.screens.checkout.CheckoutScreen
import com.mascom.app.ui.screens.console.ConsoleScreen
import com.mascom.app.ui.screens.orders.OrderDetailScreen
import com.mascom.app.ui.screens.orders.OrdersScreen
import com.mascom.app.ui.screens.product.ProductScreen
import com.mascom.app.ui.screens.shop.ShopScreen
import com.mascom.app.ui.screens.welcome.WelcomeScreen
import com.mascom.app.ui.theme.GlassSpec
import com.mascom.app.ui.theme.LocalAppHaze
import com.mascom.app.ui.theme.LocalBottomBarPadding
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.glass
import dev.chrisbanes.haze.hazeSource
import dev.chrisbanes.haze.rememberHazeState
import kotlin.math.abs
import kotlin.reflect.KClass

private data class Tab(
    val route: Any,
    val type: KClass<*>,
    val label: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector,
)

private fun tabsFor(user: User?) = buildList {
    add(Tab(ShopRoute, ShopRoute::class, "Shop", Icons.Outlined.Storefront, Icons.Rounded.Storefront))
    add(Tab(BagRoute, BagRoute::class, "Bag", Icons.Outlined.ShoppingBag, Icons.Rounded.ShoppingBag))
    add(Tab(OrdersRoute, OrdersRoute::class, "Orders", Icons.AutoMirrored.Outlined.ReceiptLong, Icons.AutoMirrored.Rounded.ReceiptLong))
    if (user?.canUseConsole == true) {
        add(Tab(ConsoleRoute, ConsoleRoute::class, "Console", Icons.Outlined.Dashboard, Icons.Rounded.Dashboard))
    }
    add(Tab(AccountRoute, AccountRoute::class, "You", Icons.Outlined.Person, Icons.Rounded.Person))
}

private val TabTypes = listOf(ShopRoute::class, BagRoute::class, OrdersRoute::class, ConsoleRoute::class, AccountRoute::class)
private fun NavDestination.isTab() = TabTypes.any { hasRoute(it) }
private fun NavDestination.isProduct() = hasRoute(ProductRoute::class)
private fun NavDestination.isWelcome() = hasRoute(WelcomeRoute::class)

private val TabBarHeight = 64.dp
private val PushSpring = spring<androidx.compose.ui.unit.IntOffset>(dampingRatio = 1f, stiffness = Spring.StiffnessMediumLow)

// Tabs cross-fade with a slight zoom ("fade through"); pushed screens slide; the product page
// fades so its photo can fly in from the grid as a shared element.
private fun AnimatedContentTransitionScope<NavBackStackEntry>.enter(pop: Boolean): EnterTransition = when {
    // Leaving the welcome, the shop gently blooms in.
    initialState.destination.isWelcome() -> fadeIn(tween(500, delayMillis = 100)) + scaleIn(tween(600), initialScale = 0.94f)
    targetState.destination.isProduct() || (pop && initialState.destination.isProduct()) -> fadeIn(tween(320))
    initialState.destination.isTab() && targetState.destination.isTab() ->
        fadeIn(tween(240, delayMillis = 70)) + scaleIn(tween(300), initialScale = 0.97f)
    pop -> slideInHorizontally(PushSpring) { -it / 5 } + fadeIn(tween(250))
    else -> slideInHorizontally(PushSpring) { it / 3 } + fadeIn(tween(250))
}

private fun AnimatedContentTransitionScope<NavBackStackEntry>.exit(pop: Boolean): ExitTransition = when {
    initialState.destination.isWelcome() -> fadeOut(tween(350)) + scaleOut(tween(400), targetScale = 1.06f)
    targetState.destination.isProduct() || (pop && initialState.destination.isProduct()) -> fadeOut(tween(260))
    initialState.destination.isTab() && targetState.destination.isTab() -> fadeOut(tween(90))
    pop -> slideOutHorizontally(PushSpring) { it / 3 } + fadeOut(tween(200))
    else -> slideOutHorizontally(PushSpring) { -it / 5 } + fadeOut(tween(200))
}

@OptIn(ExperimentalSharedTransitionApi::class)
@Composable
fun MascomRoot(app: AppViewModel, showWelcome: Boolean, openOrderId: String?, onOrderOpened: () -> Unit) {
    val nav = rememberNavController()
    // Decided once: flipping the "seen" flag later must not swap the graph's start.
    val start: Any = remember { if (showWelcome) WelcomeRoute() else ShopRoute }
    val user by app.user.collectAsStateWithLifecycle()
    val bagCount by app.bagCount.collectAsStateWithLifecycle()
    val backStack by nav.currentBackStackEntryAsState()
    val destination = backStack?.destination
    val tabs = tabsFor(user)
    val onTab = tabs.any { tab -> destination?.hasRoute(tab.type) == true }
    val haze = rememberHazeState()
    val navInset = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
    // The nav graph is built once, so it reads the user through this rather than capturing it.
    val currentUser by rememberUpdatedState(user)

    LaunchedEffect(openOrderId) {
        if (openOrderId != null) {
            nav.navigate(OrderRoute(openOrderId))
            onOrderOpened()
        }
    }

    CompositionLocalProvider(LocalAppHaze provides haze) {
        Box(Modifier.fillMaxSize().background(Mascom.colors.page)) {
            SharedTransitionLayout(Modifier.fillMaxSize()) {
                CompositionLocalProvider(
                    LocalSharedTransitionScope provides this,
                    LocalBottomBarPadding provides if (onTab) TabBarHeight + 16.dp else 0.dp,
                ) {
                    NavHost(
                        navController = nav,
                        startDestination = start,
                        modifier = Modifier.fillMaxSize().hazeSource(haze),
                        enterTransition = { enter(pop = false) },
                        exitTransition = { exit(pop = false) },
                        popEnterTransition = { enter(pop = true) },
                        popExitTransition = { exit(pop = true) },
                    ) {
                        graph(nav, onWelcomeDone = app::markWelcomeSeen) { currentUser }
                    }
                }
            }

            AnimatedVisibility(
                visible = onTab,
                modifier = Modifier.align(Alignment.BottomCenter),
                enter = slideInVertically(spring(dampingRatio = 0.8f, stiffness = 380f)) { it } + fadeIn(),
                exit = slideOutVertically(tween(220)) { it } + fadeOut(tween(180)),
            ) {
                GlassTabBar(
                    tabs = tabs,
                    current = destination,
                    bagCount = bagCount,
                    modifier = Modifier.padding(bottom = navInset + 10.dp, start = 18.dp, end = 18.dp),
                    onSelect = { tab ->
                        nav.navigate(tab.route) {
                            // Shop is the root of the tabs (the welcome screen may have been the graph's start).
                            popUpTo(ShopRoute) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                )
            }
        }
    }
}

/** Registers a destination and hands its animation scope to shared elements inside it. */
private inline fun <reified T : Any> NavGraphBuilder.screen(
    noinline enterTransition: (AnimatedContentTransitionScope<NavBackStackEntry>.() -> EnterTransition?)? = null,
    noinline popExitTransition: (AnimatedContentTransitionScope<NavBackStackEntry>.() -> ExitTransition?)? = null,
    noinline content: @Composable AnimatedContentScope.(NavBackStackEntry) -> Unit,
) {
    composable<T>(enterTransition = enterTransition, popExitTransition = popExitTransition) { entry ->
        CompositionLocalProvider(LocalNavAnimatedScope provides this) { content(entry) }
    }
}

private fun NavGraphBuilder.graph(nav: NavHostController, onWelcomeDone: () -> Unit, user: () -> User?) {
    val openAuth = { signUp: Boolean -> nav.navigate(AuthRoute(signUp)) }
    val back: () -> Unit = { nav.popBackStack() }

    screen<WelcomeRoute> { entry ->
        val replay = entry.toRoute<WelcomeRoute>().replay
        WelcomeScreen(onGetStarted = {
            onWelcomeDone()
            if (replay) {
                back()
            } else {
                nav.navigate(ShopRoute) { popUpTo<WelcomeRoute> { inclusive = true } }
                // New here: straight to sign-up; closing it lands on the shop.
                if (user() == null) openAuth(true)
            }
        })
    }

    screen<ShopRoute> {
        ShopScreen(
            onProduct = { nav.navigate(it) },
            onAbout = { nav.navigate(AboutRoute) },
            onSignIn = { openAuth(false) },
        )
    }
    screen<BagRoute> {
        BagScreen(
            onCheckout = { if (user() == null) openAuth(false) else nav.navigate(CheckoutRoute) },
            onProduct = { nav.navigate(ProductRoute(it)) },
            onShop = {
                nav.navigate(ShopRoute) {
                    popUpTo(ShopRoute) { saveState = true }
                    launchSingleTop = true
                    restoreState = true
                }
            },
        )
    }
    screen<OrdersRoute> {
        OrdersScreen(onOrder = { nav.navigate(OrderRoute(it)) }, onSignIn = { openAuth(false) })
    }
    screen<AccountRoute> {
        AccountScreen(
            onEdit = { nav.navigate(EditProfileRoute) },
            onAbout = { nav.navigate(AboutRoute) },
            onWelcome = { nav.navigate(WelcomeRoute(replay = true)) },
            onSignIn = { openAuth(false) },
            onSignUp = { openAuth(true) },
        )
    }
    screen<ConsoleRoute> { ConsoleScreen() }
    screen<ProductRoute> { entry ->
        ProductScreen(
            route = entry.toRoute<ProductRoute>(),
            onBack = back,
            onBag = { nav.navigate(BagRoute) { launchSingleTop = true } },
        )
    }
    screen<CheckoutRoute> {
        CheckoutScreen(
            onBack = back,
            onPlaced = { orderId -> nav.navigate(OrderRoute(orderId, placed = true)) { popUpTo(BagRoute) } },
        )
    }
    screen<OrderRoute> { entry ->
        val route = entry.toRoute<OrderRoute>()
        OrderDetailScreen(id = route.id, placed = route.placed, onBack = back)
    }
    screen<AuthRoute>(
        enterTransition = { slideInVertically(spring(dampingRatio = 0.9f, stiffness = 300f)) { it } + fadeIn() },
        popExitTransition = { slideOutVertically(tween(280)) { it } + fadeOut(tween(220)) },
    ) { entry ->
        AuthScreen(startWithSignUp = entry.toRoute<AuthRoute>().signUp, onDone = back, onClose = back)
    }
    screen<EditProfileRoute> { EditProfileScreen(onBack = back) }
    screen<AboutRoute> { AboutScreen(onBack = back, onGallery = { nav.navigate(GalleryRoute) }) }
    screen<GalleryRoute> { GalleryScreen(onBack = back) }
}

/**
 * The floating glass tab bar. A tinted "liquid" pill slides between tabs on a spring and
 * stretches while it moves; the chosen icon fills in and gives a little bounce.
 */
@Composable
private fun GlassTabBar(
    tabs: List<Tab>,
    current: NavDestination?,
    bagCount: Int,
    onSelect: (Tab) -> Unit,
    modifier: Modifier = Modifier,
) {
    val haptics = LocalHapticFeedback.current
    val c = Mascom.colors
    val selectedIndex = tabs.indexOfFirst { tab -> current?.hierarchy?.any { it.hasRoute(tab.type) } == true }

    BoxWithConstraints(
        modifier
            .widthIn(max = 520.dp)
            .fillMaxWidth()
            .height(TabBarHeight)
            .glass(LocalAppHaze.current, RoundedCornerShape(TabBarHeight / 2), frost = GlassSpec.BarFrost)
            .padding(5.dp),
    ) {
        val itemWidth = maxWidth / tabs.size
        val target = itemWidth * selectedIndex.coerceAtLeast(0)
        val pillOffset by animateDpAsState(target, spring(dampingRatio = 0.72f, stiffness = 420f), label = "pill")
        if (selectedIndex >= 0) {
            Box(
                Modifier
                    .offset(x = pillOffset)
                    .width(itemWidth)
                    .fillMaxHeight()
                    .graphicsLayer {
                        // Stretch along the direction of travel, like a drop of liquid.
                        val stretch = (abs((target - pillOffset).value) / itemWidth.value).coerceAtMost(1f) * 0.35f
                        scaleX = 1f + stretch
                        scaleY = 1f - stretch * 0.25f
                    }
                    .clip(RoundedCornerShape(TabBarHeight / 2))
                    .background(c.tintGlow),
            )
        }
        Row(Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
            tabs.forEachIndexed { index, tab ->
                TabItem(
                    tab = tab,
                    selected = index == selectedIndex,
                    badge = if (tab.type == BagRoute::class) bagCount else 0,
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                    onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
                        onSelect(tab)
                    },
                )
            }
        }
    }
}

@Composable
private fun TabItem(tab: Tab, selected: Boolean, badge: Int, modifier: Modifier, onClick: () -> Unit) {
    val c = Mascom.colors
    val fg by animateColorAsState(if (selected) c.tint else c.label2, tween(220), label = "tab-fg")
    val bounce = remember { Animatable(1f) }
    LaunchedEffect(selected) {
        if (selected) {
            bounce.animateTo(0.78f, tween(90))
            bounce.animateTo(1f, spring(dampingRatio = 0.38f, stiffness = 480f))
        }
    }
    Box(modifier.pressable(onClick, label = tab.label, pressedScale = 0.88f), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.graphicsLayer { scaleX = bounce.value; scaleY = bounce.value }) {
                Crossfade(selected, animationSpec = tween(200), label = "tab-icon") { on ->
                    Icon(if (on) tab.selectedIcon else tab.icon, contentDescription = null, tint = fg, modifier = Modifier.size(24.dp))
                }
                if (tab.type == BagRoute::class) BagBadge(badge, Modifier.align(Alignment.TopEnd).offset(x = 10.dp, y = (-6).dp))
            }
            Text(tab.label, color = fg, style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp))
        }
    }
}

/** The bag count, which pops each time something new goes in. */
@Composable
private fun BagBadge(count: Int, modifier: Modifier) {
    val c = Mascom.colors
    val pop = remember { Animatable(1f) }
    var last by remember { mutableIntStateOf(count) }
    LaunchedEffect(count) {
        if (count > last) {
            pop.snapTo(1.55f)
            pop.animateTo(1f, spring(dampingRatio = 0.32f, stiffness = 380f))
        }
        last = count
    }
    AnimatedVisibility(count > 0, modifier = modifier, enter = scaleIn(spring(dampingRatio = 0.4f)), exit = scaleOut()) {
        Box(
            Modifier
                .graphicsLayer { scaleX = pop.value; scaleY = pop.value }
                .clip(CircleShape)
                .background(c.danger)
                .padding(horizontal = 5.dp, vertical = 1.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                if (count > 99) "99+" else "$count",
                color = Color.White,
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, letterSpacing = 0.sp),
                textAlign = TextAlign.Center,
            )
        }
    }
}
