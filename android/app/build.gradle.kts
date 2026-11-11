plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Change this to the live domain once deployed (e.g. https://studentsacademy.in)
val siteUrl: String = (project.findProperty("SITE_URL") as String?) ?: "https://students-academy.vercel.app"

android {
    namespace = "in.studentsacademy.app"
    compileSdk = 34
    defaultConfig {
        applicationId = "in.studentsacademy.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 5
        versionName = "1.3.1"
        buildConfigField("String", "SITE_URL", "\"$siteUrl\"")
    }
    buildFeatures { buildConfig = true }
    signingConfigs {
        create("release") {
            val ks = System.getenv("KEYSTORE_FILE")
            if (ks != null) {
                storeFile = file(ks)
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            if (System.getenv("KEYSTORE_FILE") != null) signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("androidx.browser:browser:1.8.0")
}
