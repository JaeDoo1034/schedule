#!/usr/bin/env ruby

require "date"
require "json"
require "time"
require "yaml"

module MyPlanner
  class RelativeDateResolver
    def initialize(concepts_path)
      @config = YAML.safe_load(File.read(concepts_path), permitted_classes: [], aliases: false)
      @aliases = build_alias_index(@config.fetch("concepts").fetch("relative_date"))
    end

    def resolve_text(text:, reference_datetime:, timezone:)
      alias_entry = @aliases
        .sort_by { |word, _| -word.length }
        .find { |word, _| text.include?(word) }

      raise ArgumentError, "UNSUPPORTED_EXPRESSION" unless alias_entry

      original_text, concept = alias_entry
      resolve(
        expression: concept.fetch("canonical"),
        original_text: original_text,
        reference_datetime: reference_datetime,
        timezone: timezone,
        offset_days: concept.fetch("offset_days")
      )
    end

    private

    def build_alias_index(concepts)
      concepts.each_value.each_with_object({}) do |concept, index|
        concept.fetch("aliases").each { |word| index[word] = concept }
      end
    end

    def resolve(expression:, original_text:, reference_datetime:, timezone:, offset_days:)
      previous_timezone = ENV["TZ"]
      ENV["TZ"] = timezone
      local_reference = Time.iso8601(reference_datetime).getlocal
      resolved_date = local_reference.to_date + offset_days

      {
        "original_text" => original_text,
        "canonical_expression" => expression,
        "resolved_date" => resolved_date.iso8601,
        "reference_datetime" => reference_datetime,
        "timezone" => timezone,
        "tool" => "resolve_relative_date"
      }
    ensure
      ENV["TZ"] = previous_timezone
    end
  end
end

if $PROGRAM_NAME == __FILE__
  if ARGV.length != 4
    warn "Usage: ruby date_resolver.rb CONCEPTS_YAML TEXT REFERENCE_DATETIME TIMEZONE"
    exit 2
  end

  concepts_path, text, reference_datetime, timezone = ARGV
  resolver = MyPlanner::RelativeDateResolver.new(concepts_path)

  begin
    puts JSON.pretty_generate(
      resolver.resolve_text(
        text: text,
        reference_datetime: reference_datetime,
        timezone: timezone
      )
    )
  rescue ArgumentError => error
    warn JSON.generate("error" => error.message)
    exit 1
  end
end
