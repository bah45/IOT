// ESP32-C3 firmware — Energy-Aware Self-Powered Predictive Maintenance Node
// Simulated in Wokwi (MPU6050 stands in for ADXL335/ADXL362; potentiometers
// stand in for ACS712 current and the LTC3588-1 supercap voltage divider).
// Posts telemetry directly to Supabase's PostgREST endpoint over HTTPS.

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>
#include <math.h>

// ---- Wi-Fi (Wokwi's free virtual access point) ----
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

// ---- Supabase project ----
const char* SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co/rest/v1/telemetry";
const char* SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

#define PIN_SDA 8
#define PIN_SCL 9
#define PIN_POT_CURRENT 0
#define PIN_POT_SUPERCAP 1
#define PIN_LED 2

Adafruit_MPU6050 mpu;

const int BUFFER_SIZE = 25;
float vibration_buffer[BUFFER_SIZE];
int buffer_index = 0;
bool buffer_filled = false;

float clean_val(float val, float fallback = 0.0) {
  if (isnan(val) || isinf(val)) return fallback;
  return val;
}

float calculate_mean(float data[], int size) {
  float sum = 0.0;
  for (int i = 0; i < size; i++) sum += clean_val(data[i]);
  return sum / size;
}

float calculate_stddev(float data[], int size, float m) {
  float sq = 0.0;
  for (int i = 0; i < size; i++) sq += pow(clean_val(data[i]) - m, 2);
  float sd = sqrt(sq / size);
  return (sd < 0.01) ? 0.01 : sd;
}

float calculate_kurtosis(float data[], int size, float m, float sd) {
  if (sd <= 0.01) return 3.0;
  float sum4 = 0.0;
  for (int i = 0; i < size; i++) sum4 += pow((clean_val(data[i]) - m) / sd, 4);
  float k = sum4 / size;
  return (k < 1.0 || isnan(k) || isinf(k)) ? 3.0 : k;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);
  delay(1000);

  Serial.println("\n=== ESP32-C3 Energy-Aware Predictive Maintenance Node ===");
  Wire.begin(PIN_SDA, PIN_SCL);

  if (!mpu.begin()) {
    Serial.println("[ERROR] Vibration sensor init failed.");
  } else {
    Serial.println("[OK] Vibration sensor ready.");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  }

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("[WiFi] Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connected. IP: " + WiFi.localIP().toString());

  for (int i = 0; i < BUFFER_SIZE; i++) vibration_buffer[i] = 0.5;
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    float gx = a.acceleration.x / 9.80665;
    float gy = a.acceleration.y / 9.80665;
    float gz = (a.acceleration.z - 9.80665) / 9.80665;
    float raw_rms_g = clean_val(sqrt(gx * gx + gy * gy + gz * gz), 0.05);

    float velocity_mms = clean_val(raw_rms_g * 15.6, 0.8); // ISO 10816 approximation

    vibration_buffer[buffer_index] = velocity_mms;
    buffer_index = (buffer_index + 1) % BUFFER_SIZE;
    if (buffer_index == 0) buffer_filled = true;
    int n = buffer_filled ? BUFFER_SIZE : buffer_index + 1;

    float m = calculate_mean(vibration_buffer, n);
    float sd = calculate_stddev(vibration_buffer, n, m);
    float z = clean_val((velocity_mms - m) / sd, 0.0);
    float kurt = calculate_kurtosis(vibration_buffer, n, m, sd);

    int raw_current = analogRead(PIN_POT_CURRENT);
    int raw_cap = analogRead(PIN_POT_SUPERCAP);
    float current_a = clean_val((raw_current / 4095.0) * 20.0, 0.0);
    float cap_v = clean_val((raw_cap / 4095.0) * 5.5, 3.8);
    float harvest_mw = clean_val(cap_v * 12.2, 45.0);

    StaticJsonDocument<512> doc;
    doc["node_id"] = "esp32_c3_node_01";
    doc["vibration_rms"] = round(raw_rms_g * 1000.0) / 1000.0;
    doc["vibration_velocity"] = round(velocity_mms * 1000.0) / 1000.0;
    doc["kurtosis"] = round(kurt * 1000.0) / 1000.0;
    doc["motor_current"] = round(current_a * 1000.0) / 1000.0;
    doc["harvest_rate_mw"] = round(harvest_mw * 1000.0) / 1000.0;
    doc["z_score"] = round(z * 1000.0) / 1000.0;
    doc["supercap_voltage"] = round(cap_v * 1000.0) / 1000.0;

    String payload;
    serializeJson(doc, payload);

    HTTPClient http;
    http.begin(SUPABASE_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    http.addHeader("Prefer", "return=minimal");

    digitalWrite(PIN_LED, HIGH);
    int code = http.POST(payload);
    digitalWrite(PIN_LED, LOW);

    if (code == 201 || code == 200) {
      Serial.printf("[OK] Sent | Vel: %.2f mm/s | Cap: %.2f V | Current: %.2f A\n", velocity_mms, cap_v, current_a);
    } else {
      Serial.printf("[HTTP %d] %s\n", code, http.getString().c_str());
    }
    http.end();
  } else {
    Serial.println("[WiFi] Lost connection, reconnecting...");
    WiFi.reconnect();
  }

  delay(3000); // adjust to match sampling_interval_s in Configuration page
}
