# Load Testing

Load testing suite for the Alecia M&A Platform using [k6](https://k6.io/).

## Installation

```bash
# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Usage

### Quick Smoke Test
```bash
k6 run tests/load/scenarios.js --env SCENARIO=smoke
```

### Normal Load Test (Default)
```bash
k6 run tests/load/scenarios.js
```

### Stress Test
```bash
k6 run tests/load/scenarios.js --env SCENARIO=stress
```

### Spike Test
```bash
k6 run tests/load/scenarios.js --env SCENARIO=spike
```

### Soak Test (30 minutes)
```bash
k6 run tests/load/scenarios.js --env SCENARIO=soak
```

### Custom Target URL
```bash
k6 run tests/load/scenarios.js --env BASE_URL=https://staging.alecia.markets
```

## Scenarios

| Scenario | VUs | Duration | Purpose |
|----------|-----|----------|---------|
| `smoke` | 10 | 1 min | Quick validation |
| `load` | 0→50 | 5 min | Normal load testing |
| `stress` | 0→150 | 12 min | Peak load testing |
| `spike` | 10→200→10 | ~3 min | Sudden traffic spike |
| `soak` | 30 | 30 min | Extended stability test |

## Thresholds

Tests pass if:
- 95% of requests complete under 500ms
- 99% of requests complete under 1000ms
- Less than 1% request failure rate
- Less than 5% application error rate

## Test Coverage

The load tests cover:

1. **Page Loads** (30% weight)
   - Home page
   - Admin dashboard
   - Pipeline view
   - Deals list
   - Data rooms

2. **Deals API** (25% weight)
   - List deals query
   - Response time validation

3. **Deal Detail** (20% weight)
   - Individual deal fetch
   - Response time validation

4. **Data Room Access** (10% weight)
   - List data rooms
   - Access control validation

5. **Document List** (10% weight)
   - List documents query

6. **Search** (5% weight)
   - Search API calls

## Results

Results are saved to `tests/load/results/summary.json` after each run.

Example output:
```
╔══════════════════════════════════════════════════════════════════╗
║                    LOAD TEST RESULTS                             ║
╠══════════════════════════════════════════════════════════════════╣
║  Scenario: load                                                  ║
║  Target: http://localhost:3000                                   ║
╠══════════════════════════════════════════════════════════════════╣
║  METRICS                                                         ║
║  Total Requests: 1523                                            ║
║  Avg Duration: 127.45ms                                          ║
║  P95 Duration: 342.18ms                                          ║
║  P99 Duration: 567.32ms                                          ║
║  Error Rate: 0.13%                                               ║
╚══════════════════════════════════════════════════════════════════╝
```

## CI Integration

Add to GitHub Actions:

```yaml
- name: Run Load Tests
  uses: grafana/k6-action@v0.3.1
  with:
    filename: tests/load/scenarios.js
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
    SCENARIO: smoke
```

## Customization

### Adding New Test Scenarios

Edit `scenarios.js` and add new functions:

```javascript
function testMyNewEndpoint() {
  group("My New Test", () => {
    const res = http.get(`${BASE_URL}/api/my-endpoint`);
    check(res, {
      "returns 200": (r) => r.status === 200,
    });
  });
}
```

Then add to the `actions` array with appropriate weight.

### Adjusting Thresholds

Modify the `thresholds` object in `scenarios.js`:

```javascript
const thresholds = {
  http_req_duration: ["p(95)<300"], // Stricter threshold
  http_req_failed: ["rate<0.001"],  // 0.1% failure rate
};
```
