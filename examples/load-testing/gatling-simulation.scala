/**
 * Gatling Load Testing Simulation - Production-Ready Example
 *
 * This simulation demonstrates comprehensive load testing with Gatling including:
 * - Multiple user scenarios with realistic journeys
 * - Various load injection profiles (ramp, constant, heaviside)
 * - HTTP protocol configuration with connection management
 * - Feeders for test data parameterization
 * - Checks and assertions for validation
 * - Custom reports and metrics
 *
 * Usage:
 *   Interactive mode:     ./bin/gatling.sh
 *   Direct simulation:    ./bin/gatling.sh -s LoadTestingSimulation
 *   With custom config:   ./bin/gatling.sh -s LoadTestingSimulation -rf results/
 *   Maven:               mvn gatling:test
 *   Gradle:              gradle gatlingRun
 *
 * Compile:
 *   scalac -cp "gatling-charts-highcharts-bundle-3.10.3/lib/*" gatling-simulation.scala
 */

package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import scala.util.Random

/**
 * Main load testing simulation
 */
class LoadTestingSimulation extends Simulation {

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  // Environment configuration
  val baseUrl = System.getProperty("baseUrl", "https://api.example.com")
  val numUsers = Integer.getInteger("users", 100)
  val rampDuration = Integer.getInteger("rampup", 300) // seconds
  val testDuration = Integer.getInteger("duration", 600) // seconds

  // ============================================================================
  // HTTP PROTOCOL CONFIGURATION
  // ============================================================================

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .userAgentHeader("Gatling-LoadTest/3.10")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("en-US,en;q=0.9")

    // Connection management
    .shareConnections // Share connections across virtual users
    .maxConnectionsPerHost(10)
    .connectionHeader("keep-alive")

    // Performance tuning
    .disableWarmUp // Disable warm-up if already handled
    .asyncNameResolution() // Async DNS resolution

    // SSL/TLS configuration
    .enableHttp2

    // Timeouts
    .requestTimeout(30.seconds)
    .readTimeout(30.seconds)

    // Inference of HTML resources (CSS, JS, images)
    .inferHtmlResources(
      AllowList(),
      DenyList(".*\\.css", ".*\\.js", ".*\\.ico")
    )

  // ============================================================================
  // FEEDERS - Test Data
  // ============================================================================

  // User credentials feeder
  val userFeeder = csv("test-users.csv").circular

  // Product data feeder
  val productFeeder = Iterator.continually(Map(
    "productId" -> Random.nextInt(1000) + 1,
    "quantity" -> Random.nextInt(5) + 1
  ))

  // Random data feeder
  val randomDataFeeder = Iterator.continually(Map(
    "thinkTime" -> (Random.nextInt(5) + 2),
    "randomValue" -> Random.alphanumeric.take(10).mkString
  ))

  // ============================================================================
  // CHECKS - Response Validation
  // ============================================================================

  // Common checks
  val checkStatus200 = status.is(200)
  val checkStatus201 = status.is(201)
  val checkStatus200or201 = status.in(200, 201)

  // Response time checks
  val checkResponseTime500ms = responseTimeInMillis.lte(500)
  val checkResponseTime1000ms = responseTimeInMillis.lte(1000)
  val checkResponseTime2000ms = responseTimeInMillis.lte(2000)

  // Content checks
  val checkJsonContent = jsonPath("$").exists
  val checkHasProducts = jsonPath("$.products").exists
  val checkHasToken = jsonPath("$.token").exists
  val checkHasOrderId = jsonPath("$.orderId").exists

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Generate think time between actions
   */
  def thinkTime(min: Int, max: Int) = {
    pause(min.seconds, max.seconds)
  }

  // ============================================================================
  // SCENARIO 1: BROWSER USERS - Just Browsing
  // ============================================================================

  val browserScenario = scenario("Browse Products")
    .feed(randomDataFeeder)
    .exec(
      http("Homepage")
        .get("/")
        .check(checkStatus200)
    )
    .pause(2.seconds, 5.seconds)

    .exec(
      http("Product List")
        .get("/api/products")
        .queryParam("page", "1")
        .queryParam("limit", "20")
        .check(checkStatus200)
        .check(checkHasProducts)
        .check(checkResponseTime500ms)
        .check(jsonPath("$.products[*].id").findAll.saveAs("productIds"))
    )
    .pause(3.seconds, 8.seconds)

    .exec(session => {
      val productIds = session("productIds").as[Seq[String]]
      val randomProductId = productIds(Random.nextInt(productIds.length))
      session.set("selectedProductId", randomProductId)
    })

    .exec(
      http("Product Detail")
        .get("/api/products/${selectedProductId}")
        .check(checkStatus200)
        .check(jsonPath("$.id").exists)
        .check(jsonPath("$.price").exists)
        .check(checkResponseTime500ms)
    )
    .pause(5.seconds, 15.seconds)

  // ============================================================================
  // SCENARIO 2: SHOPPER USERS - Browse and Add to Cart
  // ============================================================================

  val shopperScenario = scenario("Shopping Journey")
    .feed(randomDataFeeder)
    .feed(productFeeder)

    // Browse products (reuse browser flow)
    .exec(
      http("Homepage")
        .get("/")
        .check(checkStatus200)
    )
    .pause(2.seconds, 5.seconds)

    .exec(
      http("Product List")
        .get("/api/products")
        .queryParam("page", "1")
        .queryParam("limit", "20")
        .check(checkStatus200)
        .check(checkHasProducts)
        .check(jsonPath("$.products[0].id").saveAs("productId"))
    )
    .pause(3.seconds, 8.seconds)

    .exec(
      http("Product Detail")
        .get("/api/products/${productId}")
        .check(checkStatus200)
    )
    .pause(5.seconds, 10.seconds)

    // Add to cart
    .exec(
      http("Add to Cart")
        .post("/api/cart/items")
        .body(StringBody("""{
          "productId": "${productId}",
          "quantity": ${quantity}
        }"""))
        .asJson
        .check(checkStatus200or201)
        .check(jsonPath("$.cartId").saveAs("cartId"))
    )
    .pause(2.seconds, 5.seconds)

    // View cart
    .exec(
      http("View Cart")
        .get("/api/cart")
        .check(checkStatus200)
        .check(jsonPath("$.items").exists)
    )
    .pause(3.seconds, 7.seconds)

  // ============================================================================
  // SCENARIO 3: BUYER USERS - Complete Purchase
  // ============================================================================

  val buyerScenario = scenario("Purchase Journey")
    .feed(userFeeder)
    .feed(productFeeder)

    // Login
    .exec(
      http("Login")
        .post("/auth/login")
        .body(StringBody("""{
          "username": "${username}",
          "password": "${password}"
        }"""))
        .asJson
        .check(checkStatus200)
        .check(checkHasToken)
        .check(checkResponseTime500ms)
        .check(jsonPath("$.token").saveAs("authToken"))
    )
    .pause(1.second, 3.seconds)

    // Browse products
    .exec(
      http("Product List")
        .get("/api/products")
        .header("Authorization", "Bearer ${authToken}")
        .queryParam("page", "1")
        .queryParam("limit", "20")
        .check(checkStatus200)
        .check(jsonPath("$.products[0].id").saveAs("product1"))
        .check(jsonPath("$.products[1].id").saveAs("product2"))
    )
    .pause(2.seconds, 5.seconds)

    // Add first item
    .exec(
      http("Add Item 1")
        .post("/api/cart/items")
        .header("Authorization", "Bearer ${authToken}")
        .body(StringBody("""{
          "productId": "${product1}",
          "quantity": 1
        }"""))
        .asJson
        .check(checkStatus200or201)
    )
    .pause(1.second, 3.seconds)

    // Add second item
    .exec(
      http("Add Item 2")
        .post("/api/cart/items")
        .header("Authorization", "Bearer ${authToken}")
        .body(StringBody("""{
          "productId": "${product2}",
          "quantity": 2
        }"""))
        .asJson
        .check(checkStatus200or201)
    )
    .pause(2.seconds, 4.seconds)

    // View cart
    .exec(
      http("View Cart")
        .get("/api/cart")
        .header("Authorization", "Bearer ${authToken}")
        .check(checkStatus200)
    )
    .pause(3.seconds, 5.seconds)

    // Checkout (critical transaction)
    .exec(
      http("Checkout")
        .post("/api/checkout")
        .header("Authorization", "Bearer ${authToken}")
        .body(StringBody("""{
          "paymentMethod": "credit_card",
          "shippingAddress": {
            "street": "123 Test St",
            "city": "Test City",
            "zipCode": "12345",
            "country": "US"
          },
          "billingAddress": {
            "street": "123 Test St",
            "city": "Test City",
            "zipCode": "12345",
            "country": "US"
          }
        }"""))
        .asJson
        .check(checkStatus201)
        .check(checkHasOrderId)
        .check(checkResponseTime2000ms) // Critical SLA: must complete within 2s
        .check(jsonPath("$.orderId").saveAs("orderId"))
    )
    .pause(2.seconds, 5.seconds)

    // View order confirmation
    .exec(
      http("Order History")
        .get("/api/orders")
        .header("Authorization", "Bearer ${authToken}")
        .check(checkStatus200)
        .check(jsonPath("$.orders").exists)
    )

  // ============================================================================
  // SCENARIO 4: AUTHENTICATED USER ACTIONS
  // ============================================================================

  val authenticatedScenario = scenario("Authenticated Actions")
    .feed(userFeeder)

    // Login
    .exec(
      http("Login")
        .post("/auth/login")
        .body(StringBody("""{
          "username": "${username}",
          "password": "${password}"
        }"""))
        .asJson
        .check(checkStatus200)
        .check(jsonPath("$.token").saveAs("authToken"))
    )
    .pause(1.second, 2.seconds)

    // View profile
    .exec(
      http("View Profile")
        .get("/api/users/profile")
        .header("Authorization", "Bearer ${authToken}")
        .check(checkStatus200)
    )
    .pause(2.seconds, 4.seconds)

    // Update profile
    .exec(
      http("Update Profile")
        .put("/api/users/profile")
        .header("Authorization", "Bearer ${authToken}")
        .body(StringBody("""{
          "firstName": "${firstName}",
          "lastName": "${lastName}",
          "preferences": {
            "newsletter": true,
            "notifications": true
          }
        }"""))
        .asJson
        .check(checkStatus200)
    )
    .pause(1.second, 3.seconds)

    // View orders
    .exec(
      http("Order History")
        .get("/api/orders")
        .header("Authorization", "Bearer ${authToken}")
        .check(checkStatus200)
    )

  // ============================================================================
  // SCENARIO 5: HEALTH CHECK
  // ============================================================================

  val healthCheckScenario = scenario("Health Check")
    .exec(
      http("Health Check")
        .get("/health")
        .check(checkStatus200)
        .check(checkResponseTime500ms)
    )
    .pause(5.seconds)

  // ============================================================================
  // LOAD INJECTION PROFILES
  // ============================================================================

  /**
   * Standard Load Test Profile
   * Gradual ramp-up to target load with sustained period
   */
  val standardLoadProfile = Seq(
    // Browser users (60% of traffic)
    browserScenario.inject(
      rampUsers((numUsers * 0.6).toInt) during (rampDuration.seconds), // Ramp-up
      constantUsersPerSec((numUsers * 0.6).toInt / 10) during (testDuration.seconds) // Sustained
    ).protocols(httpProtocol),

    // Shopper users (30% of traffic)
    shopperScenario.inject(
      rampUsers((numUsers * 0.3).toInt) during (rampDuration.seconds),
      constantUsersPerSec((numUsers * 0.3).toInt / 10) during (testDuration.seconds)
    ).protocols(httpProtocol),

    // Buyer users (10% of traffic)
    buyerScenario.inject(
      rampUsers((numUsers * 0.1).toInt) during (rampDuration.seconds),
      constantUsersPerSec((numUsers * 0.1).toInt / 10) during (testDuration.seconds)
    ).protocols(httpProtocol),

    // Health checks (continuous)
    healthCheckScenario.inject(
      constantUsersPerSec(1) during (testDuration.seconds)
    ).protocols(httpProtocol)
  )

  /**
   * Stress Test Profile
   * Progressive increase in load to find breaking point
   */
  val stressTestProfile = Seq(
    browserScenario.inject(
      rampUsers(50) during (2.minutes),      // Normal
      constantUsersPerSec(5) during (2.minutes),
      rampUsers(100) during (2.minutes),     // Increased
      constantUsersPerSec(10) during (2.minutes),
      rampUsers(200) during (2.minutes),     // High
      constantUsersPerSec(20) during (2.minutes),
      rampUsers(400) during (2.minutes)      // Stress
    ).protocols(httpProtocol)
  )

  /**
   * Spike Test Profile
   * Sudden traffic surge to test auto-scaling
   */
  val spikeTestProfile = Seq(
    browserScenario.inject(
      constantUsersPerSec(10) during (30.seconds),     // Normal load
      nothingFor(5.seconds),
      atOnceUsers(500),                                 // Sudden spike!
      constantUsersPerSec(50) during (3.minutes),      // Sustained spike
      nothingFor(5.seconds),
      constantUsersPerSec(10) during (2.minutes)       // Recovery
    ).protocols(httpProtocol)
  )

  /**
   * Soak Test Profile
   * Extended duration with moderate load
   */
  val soakTestProfile = Seq(
    browserScenario.inject(
      rampUsers(100) during (5.minutes),
      constantUsersPerSec(10) during (2.hours)  // 2 hour soak
    ).protocols(httpProtocol)
  )

  // ============================================================================
  // LOAD TEST SETUP - Choose profile
  // ============================================================================

  val testType = System.getProperty("testType", "standard")

  val selectedProfile = testType match {
    case "stress" => stressTestProfile
    case "spike" => spikeTestProfile
    case "soak" => soakTestProfile
    case _ => standardLoadProfile
  }

  setUp(selectedProfile)
    .protocols(httpProtocol)
    .assertions(
      // Global assertions (SLA requirements)
      global.responseTime.percentile(95.0).lt(500),     // p95 < 500ms
      global.responseTime.percentile(99.0).lt(1000),    // p99 < 1000ms
      global.successfulRequests.percent.gt(99.0),       // > 99% success rate

      // Per-scenario assertions
      forAll.failedRequests.percent.lt(1.0),            // < 1% failure per scenario

      // Critical transaction assertions
      details("Checkout").responseTime.percentile(99.0).lt(2000), // Checkout p99 < 2s
      details("Checkout").successfulRequests.percent.gt(98.0),    // Checkout > 98% success

      // Login assertions
      details("Login").responseTime.percentile(95.0).lt(300),     // Login p95 < 300ms
      details("Login").successfulRequests.percent.gt(99.0)        // Login > 99% success
    )

  // ============================================================================
  // BEFORE AND AFTER HOOKS
  // ============================================================================

  before {
    println("========================================")
    println(s"Starting Gatling Load Test")
    println(s"Base URL: $baseUrl")
    println(s"Test Type: $testType")
    println(s"Users: $numUsers")
    println(s"Ramp Duration: $rampDuration seconds")
    println(s"Test Duration: $testDuration seconds")
    println("========================================")
  }

  after {
    println("========================================")
    println("Load Test Completed")
    println("Check reports for detailed results")
    println("========================================")
  }
}

/**
 * Smoke Test Simulation - Quick validation
 */
class SmokeTestSimulation extends Simulation {
  val baseUrl = System.getProperty("baseUrl", "https://api.example.com")

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")

  val smokeScenario = scenario("Smoke Test")
    .exec(http("Health Check").get("/health").check(status.is(200)))
    .pause(1.second)
    .exec(http("Homepage").get("/").check(status.is(200)))
    .pause(1.second)
    .exec(http("Products").get("/api/products").check(status.is(200)))

  setUp(
    smokeScenario.inject(atOnceUsers(1))
  ).protocols(httpProtocol)
}

/**
 * Capacity Test Simulation - Find maximum capacity
 */
class CapacityTestSimulation extends Simulation {
  val baseUrl = System.getProperty("baseUrl", "https://api.example.com")

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")

  val simpleScenario = scenario("Capacity Test")
    .exec(http("Request").get("/api/products").check(status.is(200)))
    .pause(1.second)

  setUp(
    simpleScenario.inject(
      incrementUsersPerSec(10)
        .times(10)
        .eachLevelLasting(1.minute)
        .separatedByRampsLasting(10.seconds)
        .startingFrom(10) // Start at 10 users/sec, increment by 10, up to 100
    )
  ).protocols(httpProtocol)
    .assertions(
      global.successfulRequests.percent.gt(95.0) // Stop when success rate drops below 95%
    )
}
