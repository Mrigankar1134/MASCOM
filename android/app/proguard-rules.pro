# kotlinx.serialization: keep generated serializers for our DTOs.
-keepattributes *Annotation*, InnerClasses
-keepclassmembers @kotlinx.serialization.Serializable class com.mascom.app.** {
    *** Companion;
    *** INSTANCE;
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.mascom.app.**$$serializer { *; }

# Retrofit service interfaces are reached through reflection.
-keep,allowobfuscation,allowshrinking interface com.mascom.app.data.remote.MascomApi
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
