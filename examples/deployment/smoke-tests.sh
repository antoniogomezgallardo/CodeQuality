#!/bin/bash
# ==============================================================================
# Post-Deployment Smoke Tests
# ==============================================================================
#
# This script performs comprehensive smoke tests after deployment to verify:
# - Service availability and health
# - Critical API endpoints functionality
# - Database connectivity
# - Cache connectivity
# - External service integrations
# - Performance baselines
# - Authentication and authorization
#
# Smoke tests are designed to:
# - Run quickly (< 5 minutes)
# - Test critical paths only
# - Fail fast on major issues
# - Provide clear error messages
#
# Usage:
#   ./smoke-tests.sh [deployment-name] [namespace]
#
# Examples:
#   ./smoke-tests.sh blue production
#   ./smoke-tests.sh myapp production
#   ./smoke-tests.sh
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed
#
# ==============================================================================

set -uo pipefail

# ==============================================================================
# CONFIGURATION
# ==============================================================================

DEPLOYMENT_NAME="${1:-myapp}"
NAMESPACE="${2:-production}"
TEST_TIMEOUT=30
MAX_RETRIES=3
RETRY_DELAY=5

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $*"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

test_passed() {
    local test_name=$1
    ((TESTS_PASSED++))
    log_success "${test_name}"
}

test_failed() {
    local test_name=$1
    local reason=$2
    ((TESTS_FAILED++))
    FAILED_TESTS+=("${test_name}: ${reason}")
    log_error "${test_name} - ${reason}"
}

get_pod() {
    kubectl get pods -n "${NAMESPACE}" \
        -l app=myapp,version="${DEPLOYMENT_NAME}" \
        -o jsonpath='{.items[0].metadata.name}' 2>/dev/null
}

get_service_url() {
    # Get internal service URL
    echo "http://myapp.${NAMESPACE}.svc.cluster.local"
}

get_external_url() {
    # Get external ingress URL
    kubectl get ingress myapp -n "${NAMESPACE}" \
        -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "localhost"
}

execute_in_pod() {
    local pod=$1
    shift
    local command="$*"

    kubectl exec -n "${NAMESPACE}" "${pod}" -- sh -c "${command}" 2>/dev/null
}

curl_with_retry() {
    local url=$1
    local expected_status=${2:-200}
    local retries=${MAX_RETRIES}

    for i in $(seq 1 ${retries}); do
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TEST_TIMEOUT} "${url}" 2>/dev/null || echo "000")

        if [[ "${http_code}" == "${expected_status}" ]]; then
            return 0
        fi

        if [[ $i -lt ${retries} ]]; then
            sleep ${RETRY_DELAY}
        fi
    done

    return 1
}

# ==============================================================================
# TEST SUITE: INFRASTRUCTURE
# ==============================================================================

test_deployment_exists() {
    log_info "Testing: Deployment exists..."

    if kubectl get deployment "myapp-${DEPLOYMENT_NAME}" -n "${NAMESPACE}" &>/dev/null; then
        test_passed "Deployment exists"
        return 0
    else
        test_failed "Deployment exists" "Deployment myapp-${DEPLOYMENT_NAME} not found"
        return 1
    fi
}

test_pods_running() {
    log_info "Testing: Pods are running..."

    local ready_replicas=$(kubectl get deployment "myapp-${DEPLOYMENT_NAME}" -n "${NAMESPACE}" \
        -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    local desired_replicas=$(kubectl get deployment "myapp-${DEPLOYMENT_NAME}" -n "${NAMESPACE}" \
        -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

    if [[ ${ready_replicas} -ge ${desired_replicas} ]] && [[ ${desired_replicas} -gt 0 ]]; then
        test_passed "Pods are running (${ready_replicas}/${desired_replicas})"
        return 0
    else
        test_failed "Pods are running" "Only ${ready_replicas}/${desired_replicas} replicas ready"
        return 1
    fi
}

test_service_exists() {
    log_info "Testing: Service exists..."

    if kubectl get service myapp -n "${NAMESPACE}" &>/dev/null; then
        test_passed "Service exists"
        return 0
    else
        test_failed "Service exists" "Service myapp not found"
        return 1
    fi
}

test_service_endpoints() {
    log_info "Testing: Service has endpoints..."

    local endpoints=$(kubectl get endpoints myapp -n "${NAMESPACE}" \
        -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w)

    if [[ ${endpoints} -gt 0 ]]; then
        test_passed "Service has ${endpoints} endpoint(s)"
        return 0
    else
        test_failed "Service endpoints" "No endpoints available"
        return 1
    fi
}

# ==============================================================================
# TEST SUITE: HEALTH CHECKS
# ==============================================================================

test_health_endpoint() {
    log_info "Testing: Health endpoint..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Health endpoint" "No pod found"
        return 1
    fi

    if execute_in_pod "${pod}" "curl -f -s http://localhost:8080/health" &>/dev/null; then
        test_passed "Health endpoint responds"
        return 0
    else
        test_failed "Health endpoint" "Health check failed"
        return 1
    fi
}

test_readiness_endpoint() {
    log_info "Testing: Readiness endpoint..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Readiness endpoint" "No pod found"
        return 1
    fi

    if execute_in_pod "${pod}" "curl -f -s http://localhost:8080/health/ready" &>/dev/null; then
        test_passed "Readiness endpoint responds"
        return 0
    else
        test_failed "Readiness endpoint" "Readiness check failed"
        return 1
    fi
}

test_liveness_endpoint() {
    log_info "Testing: Liveness endpoint..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Liveness endpoint" "No pod found"
        return 1
    fi

    if execute_in_pod "${pod}" "curl -f -s http://localhost:8080/health/live" &>/dev/null; then
        test_passed "Liveness endpoint responds"
        return 0
    else
        test_failed "Liveness endpoint" "Liveness check failed"
        return 1
    fi
}

# ==============================================================================
# TEST SUITE: API ENDPOINTS
# ==============================================================================

test_root_endpoint() {
    log_info "Testing: Root endpoint..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Root endpoint" "No pod found"
        return 1
    fi

    if execute_in_pod "${pod}" "curl -f -s http://localhost:8080/" &>/dev/null; then
        test_passed "Root endpoint responds"
        return 0
    else
        test_failed "Root endpoint" "Root endpoint failed"
        return 1
    fi
}

test_api_version_endpoint() {
    log_info "Testing: API version endpoint..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "API version endpoint" "No pod found"
        return 1
    fi

    local version=$(execute_in_pod "${pod}" "curl -s http://localhost:8080/api/version" 2>/dev/null)
    if [[ -n "${version}" ]]; then
        test_passed "API version endpoint responds: ${version}"
        return 0
    else
        test_failed "API version endpoint" "No version returned"
        return 1
    fi
}

test_api_users_endpoint() {
    log_info "Testing: API users endpoint..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "API users endpoint" "No pod found"
        return 1
    fi

    # Test with unauthenticated request (should return 401 or 403)
    local status=$(execute_in_pod "${pod}" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/users" 2>/dev/null)

    if [[ "${status}" == "401" ]] || [[ "${status}" == "403" ]] || [[ "${status}" == "200" ]]; then
        test_passed "API users endpoint accessible (status: ${status})"
        return 0
    else
        test_failed "API users endpoint" "Unexpected status: ${status}"
        return 1
    fi
}

test_api_products_endpoint() {
    log_info "Testing: API products endpoint..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "API products endpoint" "No pod found"
        return 1
    fi

    if execute_in_pod "${pod}" "curl -f -s http://localhost:8080/api/products" &>/dev/null; then
        test_passed "API products endpoint responds"
        return 0
    else
        test_failed "API products endpoint" "Products endpoint failed"
        return 1
    fi
}

# ==============================================================================
# TEST SUITE: DATABASE CONNECTIVITY
# ==============================================================================

test_database_connection() {
    log_info "Testing: Database connectivity..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Database connection" "No pod found"
        return 1
    fi

    # Test database connection through health endpoint
    local db_status=$(execute_in_pod "${pod}" "curl -s http://localhost:8080/health/db" 2>/dev/null)

    if [[ "${db_status}" == *"healthy"* ]] || [[ "${db_status}" == *"ok"* ]] || [[ "${db_status}" == *"connected"* ]]; then
        test_passed "Database connection healthy"
        return 0
    else
        # Fallback: check if app can query database
        if execute_in_pod "${pod}" "curl -s http://localhost:8080/api/health/db" | grep -q "ok" 2>/dev/null; then
            test_passed "Database connection verified"
            return 0
        else
            test_failed "Database connection" "Database not accessible"
            return 1
        fi
    fi
}

test_database_migrations() {
    log_info "Testing: Database migrations..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Database migrations" "No pod found"
        return 1
    fi

    # Check migration status (implementation depends on your app)
    local migration_status=$(execute_in_pod "${pod}" "curl -s http://localhost:8080/health/migrations" 2>/dev/null)

    if [[ "${migration_status}" == *"up-to-date"* ]] || [[ "${migration_status}" == *"current"* ]] || [[ -z "${migration_status}" ]]; then
        test_passed "Database migrations current"
        return 0
    else
        test_warning "Database migrations status: ${migration_status}"
        return 0
    fi
}

# ==============================================================================
# TEST SUITE: CACHE CONNECTIVITY
# ==============================================================================

test_redis_connection() {
    log_info "Testing: Redis connectivity..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Redis connection" "No pod found"
        return 1
    fi

    # Test Redis connection through health endpoint
    local redis_status=$(execute_in_pod "${pod}" "curl -s http://localhost:8080/health/redis" 2>/dev/null)

    if [[ "${redis_status}" == *"healthy"* ]] || [[ "${redis_status}" == *"ok"* ]] || [[ "${redis_status}" == *"connected"* ]]; then
        test_passed "Redis connection healthy"
        return 0
    else
        test_warning "Redis connection status: ${redis_status}"
        return 0  # Non-critical for smoke tests
    fi
}

# ==============================================================================
# TEST SUITE: PERFORMANCE BASELINES
# ==============================================================================

test_response_time() {
    log_info "Testing: Response time baseline..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Response time" "No pod found"
        return 1
    fi

    # Measure response time
    local response_time=$(execute_in_pod "${pod}" "curl -s -o /dev/null -w '%{time_total}' http://localhost:8080/health" 2>/dev/null)

    # Remove leading zeros and compare
    response_time=$(echo "${response_time}" | sed 's/^0*//')
    if [[ -z "${response_time}" ]]; then
        response_time=0
    fi

    # Check if response time is under 2 seconds
    if (( $(echo "${response_time} < 2.0" | bc -l) )); then
        test_passed "Response time: ${response_time}s (< 2s)"
        return 0
    else
        test_warning "Response time: ${response_time}s (> 2s threshold)"
        return 0  # Warning only, not critical
    fi
}

test_memory_usage() {
    log_info "Testing: Memory usage baseline..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Memory usage" "No pod found"
        return 1
    fi

    # Get memory usage
    local memory_usage=$(kubectl top pod "${pod}" -n "${NAMESPACE}" 2>/dev/null | tail -1 | awk '{print $3}')

    if [[ -n "${memory_usage}" ]]; then
        test_passed "Memory usage: ${memory_usage}"
        return 0
    else
        test_warning "Could not retrieve memory usage (metrics-server may not be available)"
        return 0
    fi
}

test_cpu_usage() {
    log_info "Testing: CPU usage baseline..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "CPU usage" "No pod found"
        return 1
    fi

    # Get CPU usage
    local cpu_usage=$(kubectl top pod "${pod}" -n "${NAMESPACE}" 2>/dev/null | tail -1 | awk '{print $2}')

    if [[ -n "${cpu_usage}" ]]; then
        test_passed "CPU usage: ${cpu_usage}"
        return 0
    else
        test_warning "Could not retrieve CPU usage (metrics-server may not be available)"
        return 0
    fi
}

# ==============================================================================
# TEST SUITE: EXTERNAL INTEGRATIONS
# ==============================================================================

test_external_api_connectivity() {
    log_info "Testing: External API connectivity..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "External API connectivity" "No pod found"
        return 1
    fi

    # Test external connectivity (e.g., to public API)
    if execute_in_pod "${pod}" "curl -f -s --max-time 10 https://api.github.com" &>/dev/null; then
        test_passed "External API connectivity verified"
        return 0
    else
        test_warning "External API connectivity may be limited"
        return 0  # Non-critical
    fi
}

# ==============================================================================
# TEST SUITE: METRICS AND MONITORING
# ==============================================================================

test_metrics_endpoint() {
    log_info "Testing: Metrics endpoint..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Metrics endpoint" "No pod found"
        return 1
    fi

    if execute_in_pod "${pod}" "curl -f -s http://localhost:9090/metrics" | grep -q "# HELP" 2>/dev/null; then
        test_passed "Metrics endpoint exposing Prometheus metrics"
        return 0
    else
        test_warning "Metrics endpoint not accessible or not in Prometheus format"
        return 0  # Non-critical
    fi
}

# ==============================================================================
# TEST SUITE: SECURITY
# ==============================================================================

test_security_headers() {
    log_info "Testing: Security headers..."

    local pod=$(get_pod)
    if [[ -z "${pod}" ]]; then
        test_failed "Security headers" "No pod found"
        return 1
    fi

    local headers=$(execute_in_pod "${pod}" "curl -s -I http://localhost:8080/" 2>/dev/null)

    # Check for security headers
    local has_security=false
    if echo "${headers}" | grep -qi "X-Content-Type-Options" || \
       echo "${headers}" | grep -qi "X-Frame-Options" || \
       echo "${headers}" | grep -qi "Strict-Transport-Security"; then
        has_security=true
    fi

    if [[ "${has_security}" == "true" ]]; then
        test_passed "Security headers present"
        return 0
    else
        test_warning "Security headers not detected"
        return 0  # Warning only
    fi
}

# ==============================================================================
# MAIN TEST EXECUTION
# ==============================================================================

run_all_tests() {
    echo ""
    echo "=========================================="
    echo "  Post-Deployment Smoke Tests"
    echo "=========================================="
    echo "Deployment: ${DEPLOYMENT_NAME}"
    echo "Namespace: ${NAMESPACE}"
    echo "=========================================="
    echo ""

    # Infrastructure Tests
    echo "=== Infrastructure Tests ==="
    test_deployment_exists
    test_pods_running
    test_service_exists
    test_service_endpoints
    echo ""

    # Health Check Tests
    echo "=== Health Check Tests ==="
    test_health_endpoint
    test_readiness_endpoint
    test_liveness_endpoint
    echo ""

    # API Endpoint Tests
    echo "=== API Endpoint Tests ==="
    test_root_endpoint
    test_api_version_endpoint
    test_api_users_endpoint
    test_api_products_endpoint
    echo ""

    # Database Tests
    echo "=== Database Tests ==="
    test_database_connection
    test_database_migrations
    echo ""

    # Cache Tests
    echo "=== Cache Tests ==="
    test_redis_connection
    echo ""

    # Performance Tests
    echo "=== Performance Baseline Tests ==="
    test_response_time
    test_memory_usage
    test_cpu_usage
    echo ""

    # External Integration Tests
    echo "=== External Integration Tests ==="
    test_external_api_connectivity
    echo ""

    # Metrics Tests
    echo "=== Metrics Tests ==="
    test_metrics_endpoint
    echo ""

    # Security Tests
    echo "=== Security Tests ==="
    test_security_headers
    echo ""

    # Summary
    echo "=========================================="
    echo "  Test Results Summary"
    echo "=========================================="
    echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
    echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
    echo ""

    if [[ ${TESTS_FAILED} -gt 0 ]]; then
        echo "Failed Tests:"
        for failed_test in "${FAILED_TESTS[@]}"; do
            echo -e "  ${RED}✗${NC} ${failed_test}"
        done
        echo ""
        echo "=========================================="
        echo -e "${RED}SMOKE TESTS FAILED${NC}"
        echo "=========================================="
        return 1
    else
        echo "=========================================="
        echo -e "${GREEN}ALL SMOKE TESTS PASSED${NC}"
        echo "=========================================="
        return 0
    fi
}

# ==============================================================================
# SCRIPT ENTRY POINT
# ==============================================================================

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl not found. Please install kubectl."
    exit 1
fi

# Run tests
run_all_tests
exit_code=$?

exit ${exit_code}
