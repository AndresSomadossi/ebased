# Changelog

## [1.1.0] - 14-09-2020

### Added

- (docs) CHANGELOG :)
- (utils/error) FaultHanlded now has a new static method captureUnhanlded that allows to replace the line (typeof Handled)
- (service/downstream) new SNS publish.
- (input) new eventTopic, from AWS SNS.
- (service/downstream) each donwstream get the meta object and knows how to inject it.
- (metric) downstreamEvent and downstreamCommand. Any downstream has to use any of them to publish metrics.

### Changed
- (metric) OutputMetric now has a new log indicating the duration. 
- (structure) This files were moved:
ebased/utils ->  ebased/util
ebased/metrics ->  ebased/metric
ebased/input ->  ebased/handler/input 
ebased/output ->  ebased/handler/output 
ebased/downstream -> ebased/service/downstream
ebased/utils/inputValidation -> ebased/schema/inputValidation
ebased/utils/downstreamCommand -> ebased/schema/downstreamCommand
ebased/utils/downstreamEvent -> ebased/schema/downstreamEvent
ebased/utils/metricEvent -> ebased/schema/metricEvent
- (schema) update to Schemy 1.5.3, so nested schemas now are in the same schema.

### Removed
- (error) Handled Class as a public classs
- (metric) TracedDuration log.
- (metric) Indivual downstream metrics.