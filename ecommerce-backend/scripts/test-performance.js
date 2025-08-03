#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_ENDPOINT = '/api/products'; // Adjust based on your available endpoints

class PerformanceTester {
  constructor() {
    this.results = [];
    this.rateLimitExceeded = false;
  }

  async testSingleRequest() {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}${TEST_ENDPOINT}`, {
        timeout: 10000,
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ Request successful`);
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Rate limit remaining: ${response.headers['x-ratelimit-remaining'] || 'N/A'}`);
      console.log(`   Rate limit reset: ${response.headers['x-ratelimit-reset'] || 'N/A'}`);
      
      return {
        success: true,
        responseTime,
        status: response.status,
        rateLimitRemaining: response.headers['x-ratelimit-remaining'],
        rateLimitReset: response.headers['x-ratelimit-reset'],
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (error.response?.status === 429) {
        console.log(`❌ Rate limit exceeded`);
        console.log(`   Response time: ${responseTime}ms`);
        console.log(`   Retry after: ${error.response.data?.retryAfter || 'N/A'} seconds`);
        this.rateLimitExceeded = true;
        
        return {
          success: false,
          responseTime,
          status: 429,
          error: 'Rate limit exceeded',
          retryAfter: error.response.data?.retryAfter,
        };
      } else {
        console.log(`❌ Request failed: ${error.message}`);
        console.log(`   Response time: ${responseTime}ms`);
        
        return {
          success: false,
          responseTime,
          error: error.message,
        };
      }
    }
  }

  async testRateLimiting() {
    console.log('🚀 Testing rate limiting...\n');
    
    let requestCount = 0;
    const maxRequests = 50; // Test with 50 requests
    
    while (requestCount < maxRequests && !this.rateLimitExceeded) {
      requestCount++;
      console.log(`Request ${requestCount}/${maxRequests}:`);
      
      const result = await this.testSingleRequest();
      this.results.push(result);
      
      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('');
    }
    
    this.printSummary();
  }

  async testConcurrentRequests(concurrency = 5) {
    console.log(`🚀 Testing ${concurrency} concurrent requests...\n`);
    
    const promises = [];
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.testSingleRequest());
    }
    
    const results = await Promise.all(promises);
    this.results.push(...results);
    
    console.log('\n📊 Concurrent requests summary:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
  }

  printSummary() {
    console.log('\n📊 Performance Test Summary');
    console.log('========================');
    
    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = this.results.filter(r => !r.success).length;
    const rateLimitExceeded = this.results.filter(r => r.status === 429).length;
    
    const responseTimes = this.results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`Total requests: ${totalRequests}`);
    console.log(`Successful: ${successfulRequests}`);
    console.log(`Failed: ${failedRequests}`);
    console.log(`Rate limit exceeded: ${rateLimitExceeded}`);
    console.log(`\nResponse times:`);
    console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  Minimum: ${minResponseTime}ms`);
    console.log(`  Maximum: ${maxResponseTime}ms`);
    
    if (rateLimitExceeded > 0) {
      console.log(`\n⚠️  Rate limiting is working correctly`);
    }
    
    if (avgResponseTime > 1000) {
      console.log(`\n⚠️  Average response time is high (${avgResponseTime.toFixed(2)}ms)`);
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Performance Tests');
    console.log('=============================\n');
    
    // Test single request first
    console.log('1. Single Request Test');
    console.log('----------------------');
    await this.testSingleRequest();
    console.log('');
    
    // Test rate limiting
    console.log('2. Rate Limiting Test');
    console.log('---------------------');
    await this.testRateLimiting();
    
    // Reset for concurrent test
    this.results = [];
    this.rateLimitExceeded = false;
    
    // Test concurrent requests
    console.log('3. Concurrent Requests Test');
    console.log('----------------------------');
    await this.testConcurrentRequests(5);
    
    console.log('\n✅ All tests completed!');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new PerformanceTester();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'single':
      tester.testSingleRequest();
      break;
    case 'rate-limit':
      tester.testRateLimiting();
      break;
    case 'concurrent':
      const concurrency = parseInt(args[1]) || 5;
      tester.testConcurrentRequests(concurrency);
      break;
    default:
      tester.runAllTests();
  }
}

module.exports = PerformanceTester;