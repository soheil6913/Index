package com.example.hardware

enum class ConnectionMode {
    DISCONNECTED,
    SCANNING_BT,
    CONNECTING_BT,
    CONNECTING_USB,
    USB,
    BLUETOOTH,
    SIMULATOR,
    ERROR
}

enum class SensorType {
    GOLD_RADAR_X20,
    FMG3,
    FLC100,
    HMC5883L
}

data class DiscoveredBluetoothDevice(
    val name: String,
    val address: String,
    val isBle: Boolean = false,
    val rssi: Int = 0
)

data class SensorTelemetry(
    val adcRaw: Int = 380,
    val phaseShiftDeg: Int = 0,
    val timestampMs: Long = System.currentTimeMillis(),
    val packetCount: Long = 0,
    val signalRssi: Int? = null,
    val sensorId: String = "GOLD_RADAR_X20",
    val isChecksumValid: Boolean = true
)
