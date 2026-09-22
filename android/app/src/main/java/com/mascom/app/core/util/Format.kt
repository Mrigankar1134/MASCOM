package com.mascom.app.core.util

import java.text.NumberFormat
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val inr: NumberFormat = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("en-IN")).apply {
    maximumFractionDigits = 0
}

fun money(amount: Double): String = inr.format(amount)

private val dateFormat = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH)
private val dateTimeFormat = DateTimeFormatter.ofPattern("d MMM, h:mm a", Locale.ENGLISH)

fun Instant.shortDate(): String = dateFormat.format(atZone(ZoneId.systemDefault()))
fun Instant.dateTime(): String = dateTimeFormat.format(atZone(ZoneId.systemDefault()))

fun parseInstant(value: String?): Instant? = value?.let { runCatching { Instant.parse(it) }.getOrNull() }
