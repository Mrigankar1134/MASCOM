package com.mascom.app.data.remote.dto

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

/**
 * Mongo references arrive either as a bare id string or, when the route populates them, as an
 * object. These serializers accept both and always produce the object form.
 */
abstract class RefSerializer<T : Any>(
    private val objectSerializer: KSerializer<T>,
    private val fromId: (String) -> T,
) : KSerializer<T> {
    override val descriptor: SerialDescriptor = objectSerializer.descriptor

    override fun deserialize(decoder: Decoder): T {
        val input = decoder as? JsonDecoder ?: return objectSerializer.deserialize(decoder)
        return when (val element: JsonElement = input.decodeJsonElement()) {
            is JsonObject -> input.json.decodeFromJsonElement(objectSerializer, element)
            is JsonPrimitive -> fromId(element.contentOrNull.orEmpty())
            else -> fromId("")
        }
    }

    override fun serialize(encoder: Encoder, value: T) = objectSerializer.serialize(encoder, value)
}

@Serializable
data class UserRefDto(
    @SerialName("_id") val id: String = "",
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val rollNo: String? = null,
    val section: String? = null,
    val hostel: String? = null,
    val block: String? = null,
    val roomNo: String? = null,
)

object UserRefSerializer : RefSerializer<UserRefDto>(UserRefDto.serializer(), { UserRefDto(id = it) })

@Serializable
data class RecipientRefDto(
    @SerialName("_id") val id: String = "",
    val name: String? = null,
    val upiId: String? = null,
    val phoneNumber: String? = null,
)

object RecipientRefSerializer :
    RefSerializer<RecipientRefDto>(RecipientRefDto.serializer(), { RecipientRefDto(id = it) })

/** An id that may come back populated; keeps just the `_id`. */
object FlexibleIdSerializer : KSerializer<String> {
    override val descriptor: SerialDescriptor = String.serializer().descriptor

    override fun deserialize(decoder: Decoder): String {
        val input = decoder as? JsonDecoder ?: return decoder.decodeString()
        return when (val element = input.decodeJsonElement()) {
            is JsonObject -> element["_id"]?.jsonPrimitive?.contentOrNull.orEmpty()
            is JsonPrimitive -> element.contentOrNull.orEmpty()
            else -> ""
        }
    }

    override fun serialize(encoder: Encoder, value: String) = encoder.encodeString(value)
}
