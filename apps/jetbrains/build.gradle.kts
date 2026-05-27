plugins {
    id("org.jetbrains.kotlin.jvm") version "2.0.21"
    id("org.jetbrains.kotlin.plugin.serialization") version "2.0.21"
    id("org.jetbrains.intellij.platform") version "2.1.0"
}

group = "dev.ctok"
version = "0.1.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        intellijIdeaCommunity("2024.3")
        bundledPlugin("com.intellij.java")
        instrumentationTools()
        pluginVerifier()
    }

    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
}

intellijPlatform {
    pluginVerification {
        ides {
            recommended()
        }
    }

    pluginConfiguration {
        name = "ctok - Claude Token Estimator"
        version = "0.1.0"
        description = """
            Estimate Claude token usage, cost, and quota impact without leaving your IDE.
            <br/><br/>
            <b>Features:</b>
            <ul>
              <li>Estimate tokens for selected text or the active file</li>
              <li>See cost breakdown and model recommendation in a tool window</li>
              <li>Run the 7-pass prompt refiner inline</li>
              <li>Scan an entire project and report its token footprint</li>
            </ul>
            <br/>
            Requires <code>ctok</code> CLI on PATH (<code>npm i -g ctok</code>).
        """.trimIndent()
        changeNotes = "Initial release."
        ideaVersion {
            sinceBuild = "243"
        }
        vendor {
            name = "ctok-cli"
            url = "https://ctok.dev"
        }
    }

    signing {
        certificateChain = providers.environmentVariable("CERTIFICATE_CHAIN")
        privateKey = providers.environmentVariable("PRIVATE_KEY")
        password = providers.environmentVariable("PRIVATE_KEY_PASSWORD")
    }

    publishing {
        token = providers.environmentVariable("PUBLISH_TOKEN")
    }
}

kotlin {
    jvmToolchain(17)
}

tasks.test {
    useJUnitPlatform()
}
