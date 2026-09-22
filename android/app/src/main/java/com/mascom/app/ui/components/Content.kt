package com.mascom.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.Remove
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import coil3.compose.SubcomposeAsyncImage
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii

/** Resolves server-relative image paths against the configured server. */
val LocalUrlResolver = compositionLocalOf<(String?) -> String?> { { it } }

@Composable
fun RemoteImage(
    path: String?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
) {
    val url = LocalUrlResolver.current(path)
    val c = Mascom.colors
    if (url == null) {
        Box(modifier.background(c.fill.copy(alpha = 0.3f)))
        return
    }
    SubcomposeAsyncImage(
        model = url,
        contentDescription = contentDescription,
        contentScale = contentScale,
        modifier = modifier,
        loading = { Box(Modifier.fillMaxSize().background(c.fill.copy(alpha = 0.22f))) },
        error = { Box(Modifier.fillMaxSize().background(c.fill.copy(alpha = 0.3f))) },
    )
}

@Composable
fun MascomTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: () -> Unit = {},
    isPassword: Boolean = false,
    error: String? = null,
    singleLine: Boolean = true,
    enabled: Boolean = true,
) {
    val c = Mascom.colors
    var reveal by remember { mutableStateOf(false) }
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        label = { Text(label) },
        placeholder = placeholder?.let { { Text(it, color = c.label3) } },
        singleLine = singleLine,
        enabled = enabled,
        isError = error != null,
        supportingText = error?.let { { Text(it) } },
        shape = RoundedCornerShape(Radii.md),
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
        // Leave onNext unset so "Next" keeps moving focus to the following field.
        keyboardActions = KeyboardActions(
            onDone = { onImeAction() },
            onGo = { onImeAction() },
            onSearch = { onImeAction() },
            onSend = { onImeAction() },
        ),
        visualTransformation = if (isPassword && !reveal) PasswordVisualTransformation() else VisualTransformation.None,
        trailingIcon = if (isPassword) {
            {
                Icon(
                    if (reveal) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                    contentDescription = if (reveal) "Hide password" else "Show password",
                    // Not focusable, so the keyboard's Next skips from the password to the next field.
                    modifier = Modifier.focusProperties { canFocus = false }.pressable({ reveal = !reveal }),
                    tint = c.label2,
                )
            }
        } else null,
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = c.surface,
            unfocusedContainerColor = c.surface,
            disabledContainerColor = c.surface,
            focusedBorderColor = c.tint,
            unfocusedBorderColor = c.separator,
            focusedLabelColor = c.tint,
            unfocusedLabelColor = c.label2,
            cursorColor = c.tint,
        ),
    )
}

@Composable
fun LoadingView(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxWidth().padding(vertical = 64.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = Mascom.colors.tint, strokeWidth = 3.dp)
    }
}

@Composable
fun MessageView(
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Rounded.CloudOff,
    tint: Color = Mascom.colors.label3,
    actionText: String? = null,
    onAction: () -> Unit = {},
    secondaryText: String? = null,
    onSecondary: () -> Unit = {},
) {
    Column(
        modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 48.dp).appear(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            Modifier.floating().size(72.dp).clip(CircleShape).background(tint.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) { Icon(icon, null, Modifier.size(34.dp), tint = tint) }
        Spacer(Modifier.height(18.dp))
        Text(title, style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
        Spacer(Modifier.height(6.dp))
        Text(body, style = MaterialTheme.typography.bodyMedium, color = Mascom.colors.label2, textAlign = TextAlign.Center)
        if (actionText != null) {
            Spacer(Modifier.height(22.dp))
            MascomButton(actionText, onAction, Modifier.fillMaxWidth(0.7f))
        }
        if (secondaryText != null) {
            Spacer(Modifier.height(4.dp))
            MascomButton(secondaryText, onSecondary, kind = ButtonKind.Plain, height = 44.dp)
        }
    }
}

@Composable
fun InlineError(message: String, modifier: Modifier = Modifier) {
    val c = Mascom.colors
    Text(
        message,
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Radii.md))
            .background(c.danger.copy(alpha = 0.1f))
            .padding(horizontal = 14.dp, vertical = 12.dp),
        style = MaterialTheme.typography.bodyMedium,
        color = c.danger,
    )
}

/** Best-guess swatch for a colour name (ProductCard.tsx on the web). */
fun swatch(color: String): Color = when (color.trim().lowercase()) {
    "black" -> Color(0xFF111114)
    "white" -> Color(0xFFF6F6F8)
    "navy", "navy blue" -> Color(0xFF1B2A4A)
    "blue" -> Color(0xFF2563EB)
    "sky blue" -> Color(0xFF7DD3FC)
    "red" -> Color(0xFFDC2626)
    "maroon" -> Color(0xFF7F1D2E)
    "green" -> Color(0xFF15803D)
    "bottle green" -> Color(0xFF0F5132)
    "olive" -> Color(0xFF6B7A3A)
    "grey", "gray" -> Color(0xFF9CA3AF)
    "light grey" -> Color(0xFFD1D5DB)
    "melange grey" -> Color(0xFFB6B9C2)
    "beige" -> Color(0xFFE7DBC6)
    "cream" -> Color(0xFFF3EAD7)
    "lavender" -> Color(0xFFC4B5FD)
    "purple" -> Color(0xFF7C3AED)
    "pink" -> Color(0xFFF472B6)
    "yellow" -> Color(0xFFFACC15)
    "mustard" -> Color(0xFFD9A51B)
    "orange" -> Color(0xFFF97316)
    "brown" -> Color(0xFF6B4A2F)
    "teal" -> Color(0xFF0D9488)
    else -> Color(0xFF9CA3AF)
}

@Composable
fun SwatchDot(color: String, selected: Boolean, modifier: Modifier = Modifier, size: Int = 28) {
    val c = Mascom.colors
    Box(
        modifier
            .size((size + 8).dp)
            .border(2.dp, if (selected) c.tint else Color.Transparent, CircleShape)
            .padding(4.dp)
            .clip(CircleShape)
            .background(swatch(color))
            .border(0.5.dp, c.separator, CircleShape),
    )
}

@Composable
fun QuantityStepper(quantity: Int, onChange: (Int) -> Unit, modifier: Modifier = Modifier, max: Int = 20) {
    val c = Mascom.colors
    Row(
        modifier.clip(CircleShape).background(c.fill.copy(alpha = if (c.isDark) 0.45f else 0.22f)),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Box(Modifier.size(36.dp).pressable({ onChange(quantity - 1) }, label = "Decrease"), contentAlignment = Alignment.Center) {
            Icon(Icons.Rounded.Remove, null, Modifier.size(18.dp), tint = c.label)
        }
        Text("$quantity", style = MaterialTheme.typography.titleSmall, modifier = Modifier.width(24.dp), textAlign = TextAlign.Center)
        Box(
            Modifier.size(36.dp).pressable({ onChange(quantity + 1) }, enabled = quantity < max, label = "Increase"),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Rounded.Add, null, Modifier.size(18.dp), tint = if (quantity < max) c.label else c.label4)
        }
    }
}
