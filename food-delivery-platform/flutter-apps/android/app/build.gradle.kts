import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Firebase is optional: the plugin is applied only when a google-services.json is present
// (either at app/ or at app/src/<flavor>/).
val hasGoogleServices = listOf("customer", "vendor", "delivery", "").any {
    file(if (it.isEmpty()) "google-services.json" else "src/$it/google-services.json").exists()
}
if (hasGoogleServices) apply(plugin = "com.google.gms.google-services")

val keystoreProperties = Properties().apply {
    val f = rootProject.file("key.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

// Values injected at build time — nothing brand-specific is committed.
fun prop(name: String, fallback: String = ""): String =
    (project.findProperty(name) as String?) ?: System.getenv(name) ?: fallback

android {
    namespace = "com.fooddelivery.food_delivery_apps"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    defaultConfig {
        applicationId = prop("APP_ID_BASE", "com.fooddelivery")
        minSdk = maxOf(flutter.minSdkVersion, 23)
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
        manifestPlaceholders["googleMapsApiKey"] = prop("GOOGLE_MAPS_KEY")
    }

    signingConfigs {
        create("release") {
            if (keystoreProperties.isNotEmpty()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    // One codebase, three apps. Display names are build-time placeholders; the
    // in-app name/logo/colors are loaded at runtime from /api/config.
    flavorDimensions += "app"
    productFlavors {
        create("customer") {
            dimension = "app"
            applicationIdSuffix = ".customer"
            resValue("string", "app_name", prop("CUSTOMER_APP_NAME", "Customer"))
        }
        create("vendor") {
            dimension = "app"
            applicationIdSuffix = ".vendor"
            resValue("string", "app_name", prop("VENDOR_APP_NAME", "Vendor"))
        }
        create("delivery") {
            dimension = "app"
            applicationIdSuffix = ".delivery"
            resValue("string", "app_name", prop("DELIVERY_APP_NAME", "Delivery"))
        }
    }

    buildTypes {
        release {
            signingConfig = if (keystoreProperties.isNotEmpty()) signingConfigs.getByName("release") else signingConfigs.getByName("debug")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
