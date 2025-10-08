#!/bin/bash
# ==============================================================================
# Automated Deployment Script
# ==============================================================================
#
# This script automates deployment with comprehensive checks and rollback:
# - Pre-deployment validation
# - Health checks and readiness verification
# - Smoke tests execution
# - Automated rollback on failure
# - Deployment metrics collection
# - Notification integration
#
# Supports multiple deployment strategies:
# - blue-green: Instant traffic switch between environments
# - canary: Gradual traffic shift with metrics validation
# - rolling: Progressive instance replacement
#
# Usage:
#   ./deployment-script.sh --strategy <blue-green|canary|rolling> \
#                          --version <version> \
#                          --environment <env> \
#                          [--auto-rollback] \
#                          [--dry-run]
#
# Examples:
#   ./deployment-script.sh --strategy blue-green --version v2.0.0 --environment production --auto-rollback
#   ./deployment-script.sh --strategy canary --version v2.1.0 --environment staging
#   ./deployment-script.sh --strategy rolling --version v2.2.0 --environment production --dry-run
#
# ==============================================================================

set -euo pipefail

# ==============================================================================
# CONFIGURATION
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/deployment-$(date +%Y%m%d-%H%M%S).log"
METRICS_FILE="${SCRIPT_DIR}/deployment-metrics.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
STRATEGY=""
VERSION=""
ENVIRONMENT=""
AUTO_ROLLBACK=false
DRY_RUN=false
NAMESPACE="production"
KUBECTL_TIMEOUT="600s"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10

# Notification webhooks (set these in environment or CI/CD)
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
TEAMS_WEBHOOK="${TEAMS_WEBHOOK:-}"

# ==============================================================================
# LOGGING FUNCTIONS
# ==============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

log_warning() {
    log "WARNING" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

# ==============================================================================
# NOTIFICATION FUNCTIONS
# ==============================================================================

send_notification() {
    local status=$1
    local message=$2

    if [[ -n "${SLACK_WEBHOOK}" ]]; then
        curl -X POST "${SLACK_WEBHOOK}" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"Deployment ${status}: ${message}\"}" \
            > /dev/null 2>&1 || true
    fi

    if [[ -n "${TEAMS_WEBHOOK}" ]]; then
        curl -X POST "${TEAMS_WEBHOOK}" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"Deployment ${status}: ${message}\"}" \
            > /dev/null 2>&1 || true
    fi
}

# ==============================================================================
# ARGUMENT PARSING
# ==============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --strategy)
                STRATEGY="$2"
                shift 2
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --auto-rollback)
                AUTO_ROLLBACK=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Validate required arguments
    if [[ -z "${STRATEGY}" ]]; then
        log_error "Strategy is required"
        show_help
        exit 1
    fi

    if [[ -z "${VERSION}" ]]; then
        log_error "Version is required"
        show_help
        exit 1
    fi

    if [[ -z "${ENVIRONMENT}" ]]; then
        log_error "Environment is required"
        show_help
        exit 1
    fi

    # Validate strategy
    if [[ ! "${STRATEGY}" =~ ^(blue-green|canary|rolling)$ ]]; then
        log_error "Invalid strategy: ${STRATEGY}. Must be one of: blue-green, canary, rolling"
        exit 1
    fi
}

show_help() {
    cat << EOF
Automated Deployment Script

Usage:
    $0 --strategy <strategy> --version <version> --environment <env> [options]

Required Arguments:
    --strategy <strategy>       Deployment strategy (blue-green|canary|rolling)
    --version <version>         Version to deploy (e.g., v2.0.0)
    --environment <env>         Target environment (e.g., production, staging)

Optional Arguments:
    --namespace <namespace>     Kubernetes namespace (default: production)
    --auto-rollback            Automatically rollback on failure
    --dry-run                  Show what would be done without executing
    -h, --help                 Show this help message

Examples:
    $0 --strategy blue-green --version v2.0.0 --environment production --auto-rollback
    $0 --strategy canary --version v2.1.0 --environment staging
    $0 --strategy rolling --version v2.2.0 --environment production --dry-run

Environment Variables:
    SLACK_WEBHOOK              Slack webhook URL for notifications
    TEAMS_WEBHOOK              Microsoft Teams webhook URL for notifications
EOF
}

# ==============================================================================
# PRE-DEPLOYMENT CHECKS
# ==============================================================================

pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check namespace exists
    if ! kubectl get namespace "${NAMESPACE}" &> /dev/null; then
        log_error "Namespace ${NAMESPACE} does not exist"
        exit 1
    fi

    # Check Docker image exists (if using Docker registry)
    # Uncomment and modify as needed
    # if ! docker pull "myapp:${VERSION}" &> /dev/null; then
    #     log_error "Docker image myapp:${VERSION} not found"
    #     exit 1
    # fi

    # Check CI/CD pipeline status
    # Add checks for Jenkins, GitHub Actions, etc.

    # Verify database migrations are ready
    log_info "Checking database migration status..."
    # Add database migration checks here

    # Check if there are any ongoing deployments
    local ongoing_deployments=$(kubectl get deployments -n "${NAMESPACE}" -o json | jq -r '.items[] | select(.status.conditions[] | select(.type=="Progressing" and .status=="True" and .reason=="NewReplicaSetAvailable" | not)) | .metadata.name' | wc -l)
    if [[ ${ongoing_deployments} -gt 0 ]]; then
        log_warning "There are ongoing deployments in namespace ${NAMESPACE}"
        if [[ "${DRY_RUN}" == "false" ]]; then
            read -p "Do you want to continue? (yes/no): " -r
            if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                log_info "Deployment cancelled by user"
                exit 0
            fi
        fi
    fi

    log_success "Pre-deployment checks passed"
}

# ==============================================================================
# DEPLOYMENT STRATEGIES
# ==============================================================================

deploy_blue_green() {
    log_info "Starting Blue-Green deployment to version ${VERSION}..."

    # Determine current active version
    local current_version=$(kubectl get service myapp -n "${NAMESPACE}" -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "blue")
    log_info "Current active version: ${current_version}"

    # Determine target version
    local target_version
    if [[ "${current_version}" == "blue" ]]; then
        target_version="green"
    else
        target_version="blue"
    fi

    log_info "Deploying to ${target_version} environment..."

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would update deployment/myapp-${target_version} to image myapp:${VERSION}"
        return 0
    fi

    # Update target deployment
    kubectl set image deployment/myapp-${target_version} \
        -n "${NAMESPACE}" \
        myapp=myapp:${VERSION} \
        --record

    # Wait for rollout to complete
    log_info "Waiting for ${target_version} deployment to complete..."
    if ! kubectl rollout status deployment/myapp-${target_version} -n "${NAMESPACE}" --timeout="${KUBECTL_TIMEOUT}"; then
        log_error "${target_version} deployment failed"
        return 1
    fi

    # Health check
    if ! health_check "${target_version}"; then
        log_error "Health check failed for ${target_version}"
        return 1
    fi

    # Run smoke tests
    if ! run_smoke_tests "${target_version}"; then
        log_error "Smoke tests failed for ${target_version}"
        return 1
    fi

    # Switch traffic
    log_info "Switching traffic to ${target_version}..."
    kubectl patch service myapp -n "${NAMESPACE}" -p "{\"spec\":{\"selector\":{\"version\":\"${target_version}\"}}}"

    # Wait for traffic to stabilize
    sleep 10

    # Verify production traffic
    if ! verify_production_traffic; then
        log_error "Production traffic verification failed"
        return 1
    fi

    log_success "Blue-Green deployment completed successfully"
    log_info "Active: ${target_version} (${VERSION}), Standby: ${current_version}"
}

deploy_canary() {
    log_info "Starting Canary deployment to version ${VERSION}..."

    local canary_stages=(1 5 25 50 100)
    local stage_duration=300  # 5 minutes per stage

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would deploy canary version ${VERSION}"
        log_info "[DRY RUN] Canary stages: ${canary_stages[*]}%"
        return 0
    fi

    # Deploy canary deployment
    kubectl set image deployment/myapp-canary \
        -n "${NAMESPACE}" \
        myapp=myapp:${VERSION} \
        --record

    # Wait for canary to be ready
    log_info "Waiting for canary deployment to be ready..."
    if ! kubectl rollout status deployment/myapp-canary -n "${NAMESPACE}" --timeout="${KUBECTL_TIMEOUT}"; then
        log_error "Canary deployment failed"
        return 1
    fi

    # Health check canary
    if ! health_check "canary"; then
        log_error "Canary health check failed"
        return 1
    fi

    # Progressive rollout
    for stage in "${canary_stages[@]}"; do
        log_info "Increasing canary traffic to ${stage}%..."

        # Update VirtualService (Istio) or Ingress weights
        local stable_weight=$((100 - stage))
        kubectl patch virtualservice myapp -n "${NAMESPACE}" --type merge -p "
spec:
  http:
  - route:
    - destination:
        host: myapp
        subset: stable
      weight: ${stable_weight}
    - destination:
        host: myapp
        subset: canary
      weight: ${stage}
"

        # Wait for stage duration
        log_info "Monitoring canary at ${stage}% for ${stage_duration} seconds..."
        sleep "${stage_duration}"

        # Check metrics
        if ! check_canary_metrics; then
            log_error "Canary metrics check failed at ${stage}%"
            return 1
        fi

        if [[ ${stage} -eq 100 ]]; then
            log_info "Canary fully promoted"
        fi
    done

    # Promote canary to stable
    log_info "Promoting canary to stable..."
    local canary_image=$(kubectl get deployment myapp-canary -n "${NAMESPACE}" -o jsonpath='{.spec.template.spec.containers[0].image}')
    kubectl set image deployment/myapp-stable -n "${NAMESPACE}" myapp="${canary_image}"

    # Wait for stable rollout
    kubectl rollout status deployment/myapp-stable -n "${NAMESPACE}" --timeout="${KUBECTL_TIMEOUT}"

    # Remove canary
    kubectl delete deployment myapp-canary -n "${NAMESPACE}"

    log_success "Canary deployment completed successfully"
}

deploy_rolling() {
    log_info "Starting Rolling deployment to version ${VERSION}..."

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would update deployment/myapp to image myapp:${VERSION}"
        return 0
    fi

    # Update deployment
    kubectl set image deployment/myapp \
        -n "${NAMESPACE}" \
        myapp=myapp:${VERSION} \
        --record

    # Watch rollout
    log_info "Watching rolling update progress..."
    if ! kubectl rollout status deployment/myapp -n "${NAMESPACE}" --timeout="${KUBECTL_TIMEOUT}"; then
        log_error "Rolling deployment failed"
        return 1
    fi

    # Health check
    if ! health_check "myapp"; then
        log_error "Health check failed after rolling update"
        return 1
    fi

    # Run smoke tests
    if ! run_smoke_tests "myapp"; then
        log_error "Smoke tests failed after rolling update"
        return 1
    fi

    log_success "Rolling deployment completed successfully"
}

# ==============================================================================
# HEALTH CHECKS
# ==============================================================================

health_check() {
    local deployment=$1
    log_info "Running health checks for ${deployment}..."

    # Check pod status
    local ready_replicas=$(kubectl get deployment myapp-${deployment} -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    local desired_replicas=$(kubectl get deployment myapp-${deployment} -n "${NAMESPACE}" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")

    if [[ ${ready_replicas} -lt ${desired_replicas} ]]; then
        log_error "Not all replicas are ready: ${ready_replicas}/${desired_replicas}"
        return 1
    fi

    log_info "All ${desired_replicas} replicas are ready"

    # HTTP health check
    local pod=$(kubectl get pods -n "${NAMESPACE}" -l app=myapp,version=${deployment} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [[ -z "${pod}" ]]; then
        log_error "No pods found for ${deployment}"
        return 1
    fi

    log_info "Testing health endpoint on pod ${pod}..."
    for i in $(seq 1 ${HEALTH_CHECK_RETRIES}); do
        if kubectl exec -n "${NAMESPACE}" "${pod}" -- curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi

        if [[ $i -eq ${HEALTH_CHECK_RETRIES} ]]; then
            log_error "Health check failed after ${HEALTH_CHECK_RETRIES} attempts"
            return 1
        fi

        log_info "Health check attempt $i/${HEALTH_CHECK_RETRIES} failed, retrying..."
        sleep ${HEALTH_CHECK_INTERVAL}
    done

    return 1
}

# ==============================================================================
# SMOKE TESTS
# ==============================================================================

run_smoke_tests() {
    local deployment=$1
    log_info "Running smoke tests for ${deployment}..."

    if [[ -f "${SCRIPT_DIR}/smoke-tests.sh" ]]; then
        if bash "${SCRIPT_DIR}/smoke-tests.sh" "${deployment}"; then
            log_success "Smoke tests passed"
            return 0
        else
            log_error "Smoke tests failed"
            return 1
        fi
    else
        log_warning "Smoke tests script not found, skipping"
        return 0
    fi
}

# ==============================================================================
# METRICS AND VALIDATION
# ==============================================================================

check_canary_metrics() {
    log_info "Checking canary metrics..."

    # Query Prometheus for error rate comparison
    # This is a placeholder - implement actual Prometheus queries
    local canary_error_rate=$(get_metric_from_prometheus "error_rate" "canary" || echo "0")
    local stable_error_rate=$(get_metric_from_prometheus "error_rate" "stable" || echo "0")

    log_info "Canary error rate: ${canary_error_rate}%"
    log_info "Stable error rate: ${stable_error_rate}%"

    # Check if canary error rate is acceptable
    if (( $(echo "${canary_error_rate} > 1.0" | bc -l) )); then
        log_error "Canary error rate too high: ${canary_error_rate}%"
        return 1
    fi

    # Check if canary error rate is significantly higher than stable
    if (( $(echo "${canary_error_rate} > ${stable_error_rate} * 1.5" | bc -l) )); then
        log_error "Canary error rate significantly higher than stable"
        return 1
    fi

    log_success "Canary metrics check passed"
    return 0
}

get_metric_from_prometheus() {
    local metric=$1
    local version=$2

    # Placeholder for Prometheus query
    # Replace with actual Prometheus endpoint and query
    # curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{version=\"${version}\",status=~\"5..\"}[5m])"
    echo "0"
}

verify_production_traffic() {
    log_info "Verifying production traffic..."

    # Make test requests to production endpoint
    local endpoint=$(kubectl get ingress myapp -n "${NAMESPACE}" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "localhost")
    local success_count=0
    local total_requests=10

    for i in $(seq 1 ${total_requests}); do
        if curl -f -s "http://${endpoint}/health" > /dev/null 2>&1; then
            ((success_count++))
        fi
        sleep 1
    done

    local success_rate=$((success_count * 100 / total_requests))
    log_info "Production traffic success rate: ${success_rate}%"

    if [[ ${success_rate} -lt 90 ]]; then
        log_error "Production traffic verification failed: ${success_rate}% success rate"
        return 1
    fi

    log_success "Production traffic verification passed"
    return 0
}

# ==============================================================================
# ROLLBACK
# ==============================================================================

rollback_deployment() {
    log_warning "Initiating rollback..."
    send_notification "ROLLBACK" "Deployment to ${VERSION} failed, rolling back"

    case "${STRATEGY}" in
        blue-green)
            rollback_blue_green
            ;;
        canary)
            rollback_canary
            ;;
        rolling)
            rollback_rolling
            ;;
    esac

    log_success "Rollback completed"
}

rollback_blue_green() {
    log_info "Rolling back Blue-Green deployment..."

    # Determine current and previous versions
    local current_version=$(kubectl get service myapp -n "${NAMESPACE}" -o jsonpath='{.spec.selector.version}')
    local previous_version
    if [[ "${current_version}" == "blue" ]]; then
        previous_version="green"
    else
        previous_version="blue"
    fi

    # Switch back to previous version
    kubectl patch service myapp -n "${NAMESPACE}" -p "{\"spec\":{\"selector\":{\"version\":\"${previous_version}\"}}}"

    log_success "Traffic switched back to ${previous_version}"
}

rollback_canary() {
    log_info "Rolling back Canary deployment..."

    # Route all traffic to stable
    kubectl patch virtualservice myapp -n "${NAMESPACE}" --type merge -p '
spec:
  http:
  - route:
    - destination:
        host: myapp
        subset: stable
      weight: 100
'

    # Delete canary deployment
    kubectl delete deployment myapp-canary -n "${NAMESPACE}" || true

    log_success "Canary deployment removed, all traffic on stable"
}

rollback_rolling() {
    log_info "Rolling back Rolling deployment..."

    kubectl rollout undo deployment/myapp -n "${NAMESPACE}"
    kubectl rollout status deployment/myapp -n "${NAMESPACE}" --timeout="${KUBECTL_TIMEOUT}"

    log_success "Rolled back to previous version"
}

# ==============================================================================
# DEPLOYMENT METRICS
# ==============================================================================

record_deployment_metrics() {
    local status=$1
    local start_time=$2
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    cat > "${METRICS_FILE}" <<EOF
{
  "deployment_id": "$(uuidgen)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "strategy": "${STRATEGY}",
  "version": "${VERSION}",
  "environment": "${ENVIRONMENT}",
  "status": "${status}",
  "duration_seconds": ${duration},
  "auto_rollback": ${AUTO_ROLLBACK}
}
EOF

    log_info "Deployment metrics recorded in ${METRICS_FILE}"
}

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

main() {
    local start_time=$(date +%s)

    log_info "=========================================="
    log_info "Automated Deployment Script"
    log_info "=========================================="
    log_info "Strategy: ${STRATEGY}"
    log_info "Version: ${VERSION}"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Namespace: ${NAMESPACE}"
    log_info "Auto-rollback: ${AUTO_ROLLBACK}"
    log_info "Dry run: ${DRY_RUN}"
    log_info "=========================================="

    # Send deployment start notification
    send_notification "STARTED" "Deploying ${VERSION} to ${ENVIRONMENT} using ${STRATEGY} strategy"

    # Pre-deployment checks
    pre_deployment_checks

    # Execute deployment strategy
    local deployment_success=false
    case "${STRATEGY}" in
        blue-green)
            if deploy_blue_green; then
                deployment_success=true
            fi
            ;;
        canary)
            if deploy_canary; then
                deployment_success=true
            fi
            ;;
        rolling)
            if deploy_rolling; then
                deployment_success=true
            fi
            ;;
    esac

    # Handle deployment result
    if [[ "${deployment_success}" == "true" ]]; then
        log_success "=========================================="
        log_success "Deployment completed successfully!"
        log_success "Version ${VERSION} is now live in ${ENVIRONMENT}"
        log_success "=========================================="

        send_notification "SUCCESS" "Deployment of ${VERSION} to ${ENVIRONMENT} completed successfully"
        record_deployment_metrics "success" "${start_time}"
        exit 0
    else
        log_error "=========================================="
        log_error "Deployment failed!"
        log_error "=========================================="

        if [[ "${AUTO_ROLLBACK}" == "true" ]] && [[ "${DRY_RUN}" == "false" ]]; then
            rollback_deployment
            send_notification "FAILED" "Deployment of ${VERSION} failed and was rolled back"
            record_deployment_metrics "failed_rollback" "${start_time}"
        else
            send_notification "FAILED" "Deployment of ${VERSION} to ${ENVIRONMENT} failed"
            record_deployment_metrics "failed" "${start_time}"
        fi

        exit 1
    fi
}

# Parse arguments and run main
parse_arguments "$@"
main
