#!/usr/bin/env ruby

require "json"
require_relative "date_resolver"

project_root = File.expand_path("../../../..", __dir__)
concepts_path = File.join(project_root, "LLM/05-semantic-layer/semantic/temporal-concepts.yaml")
cases_path = File.join(project_root, "LLM/05-semantic-layer/tests/temporal-test-cases.json")

suite = JSON.parse(File.read(cases_path))
resolver = MyPlanner::RelativeDateResolver.new(concepts_path)

results = suite.fetch("cases").map do |test_case|
  actual = resolver.resolve_text(
    text: test_case.fetch("input"),
    reference_datetime: suite.fetch("reference_datetime"),
    timezone: suite.fetch("timezone")
  )
  expected = test_case.fetch("expected")
  checks = {
    "canonical" => actual.fetch("canonical_expression") == expected.fetch("canonical"),
    "original_text" => actual.fetch("original_text") == expected.fetch("original_text"),
    "resolved_date" => actual.fetch("resolved_date") == expected.fetch("resolved_date")
  }

  {
    "id" => test_case.fetch("id"),
    "input" => test_case.fetch("input"),
    "actual" => actual,
    "checks" => checks,
    "passed" => checks.values.all?
  }
end

report = {
  "suite_id" => suite.fetch("suite_id"),
  "passed" => results.count { |result| result.fetch("passed") },
  "total" => results.length,
  "results" => results
}

puts JSON.pretty_generate(report)
exit(report.fetch("passed") == report.fetch("total") ? 0 : 1)
