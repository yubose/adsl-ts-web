// Typical resource timing metrics:
//   - https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming#typical_resource_timing_metrics

/**
 * Creates a {@link PerformanceMark}.
 * Can be provided as input to {@link createMeasure}
 */
export function createMark(...args: Parameters<Performance['mark']>) {
  return performance.mark(...args)
}

/**
 * Creates a {@link PerformanceMeasure}
 * @param name
 * @param startMark Name of the previously created {@link PerformanceMark} or the {@link PerformanceMark} instance.
 * @param endMark Name of the previously created {@link PerformanceMark} or the {@link PerformanceMark} instance.
 *
 * @returns The created {@link PerformanceMeasure}. The value of `duration` is the milliseconds elapsed from start to end.
 */
export function createMeasure(
  name: string,
  startMark: PerformanceMark | string,
  endMark: PerformanceMark | string,
) {
  return performance.measure(
    name,
    startMark instanceof PerformanceMark ? startMark.name : startMark,
    endMark instanceof PerformanceMark ? endMark.name : endMark,
  )
}

export function getMarkName(mark: PerformanceMark | string) {
  return mark instanceof PerformanceMark ? mark.name : mark
}

export type MemoryUsageObject = ReturnType<typeof getMemoryUsage>

export function getMemoryUsage() {
  return {
    heapSizeLimit: performance.memory.jsHeapSizeLimit,
    heapSizeTotal: performance.memory.totalJSHeapSize,
    heapSizeUsed: performance.memory.usedJSHeapSize,
  }
}

export function getDNSLookupTime(value: PerformanceResourceTiming) {
  return value.domainLookupEnd - value.domainLookupStart
}

export function getRedirectionTime(value: PerformanceResourceTiming) {
  return value.redirectEnd - value.redirectStart
}

export function getResponseTime(value: PerformanceResourceTiming) {
  return value.responseEnd - value.responseStart
}

export function getTCPHandShakeTime(value: PerformanceResourceTiming) {
  return value.connectEnd - value.connectStart
}

export function getTLSNegotiatonTime(value: PerformanceResourceTiming) {
  return value.requestStart - value.secureConnectionStart
}

export function getTimeToFetchWithoutRedirects(
  value: PerformanceResourceTiming,
) {
  return value.responseEnd - value.fetchStart
}

export function isContentCompressed(value: PerformanceResourceTiming) {
  return value.decodedBodySize !== value.encodedBodySize
}
