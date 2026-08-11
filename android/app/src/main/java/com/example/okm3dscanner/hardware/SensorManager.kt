package com.example.hardware

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SensorManager {
    private val _connectionState = MutableStateFlow(ConnectionMode.SIMULATOR)
    val connectionState: StateFlow<ConnectionMode> = _connectionState.asStateFlow()

    private val _tvStatus = MutableStateFlow("شبیه‌ساز (Simulator)")
    val tvStatus: StateFlow<String> = _tvStatus.asStateFlow()

    private val _adcValue = MutableStateFlow(380)
    val adcValue: StateFlow<Int> = _adcValue.asStateFlow()

    private val _phaseShift = MutableStateFlow(2)
    val phaseShift: StateFlow<Int> = _phaseShift.asStateFlow()

    private val _sensorType = MutableStateFlow(SensorType.GOLD_RADAR_X20)
    val sensorType: StateFlow<SensorType> = _sensorType.asStateFlow()

    private val _baudRate = MutableStateFlow(115200)
    val baudRate: StateFlow<Int> = _baudRate.asStateFlow()

    private val _compassHeading = MutableStateFlow(45.0f)
    val compassHeading: StateFlow<Float> = _compassHeading.asStateFlow()

    fun autoConnect() {
        when (_connectionState.value) {
            ConnectionMode.SIMULATOR -> {
                _connectionState.value = ConnectionMode.CONNECTING_USB
                _tvStatus.value = "در حال اتصال USB..."
                _connectionState.value = ConnectionMode.USB
                _tvStatus.value = "کابل USB متصل شد"
            }
            ConnectionMode.USB -> {
                _connectionState.value = ConnectionMode.CONNECTING_BT
                _tvStatus.value = "در حال جستجوی بلوتوث..."
                _connectionState.value = ConnectionMode.BLUETOOTH
                _tvStatus.value = "بلوتوث متصل شد"
            }
            else -> {
                _connectionState.value = ConnectionMode.SIMULATOR
                _tvStatus.value = "شبیه‌ساز (Simulator)"
            }
        }
    }

    fun setSensorType(type: SensorType) {
        _sensorType.value = type
    }

    fun setBaudRate(rate: Int) {
        _baudRate.value = rate
    }

    fun setSimulatedReading(adc: Int, phase: Int) {
        _adcValue.value = adc
        _phaseShift.value = phase
    }
}
