// src/components/holiday/useHolidays.js
// ─────────────────────────────────────────────
//  Custom hook encapsulating all holiday state
//  and business logic. Page component stays clean.
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../../api/holidayApi";

export function useHolidays(initialYear) {
  const [holidays, setHolidays]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [apiError, setApiError]         = useState("");
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // ── Fetch holidays for selected year ─────────
  const loadHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHolidays(selectedYear);
      console.log("✅ Holidays loaded:", data);

      // ── Map API response → local shape ────────
      // Adjust field names to match your actual API response
      const mapped = data.map((h) => ({
        id:           h.holidayId   || h.id           || h.holiday_id,
        holidayName:  h.holidayName || h.holiday_name || h.name,
        holidayDate:  h.holidayDate || h.holiday_date || h.date,
        holidayType:  Number(h.holidayType || h.holiday_type || h.type),
        calendarYear: h.calendarYear || h.calendar_year || selectedYear,
      }));

      // Sort by date ascending
      mapped.sort((a, b) => new Date(a.holidayDate) - new Date(b.holidayDate));
      setHolidays(mapped);
    } catch (err) {
      console.error("❌ Failed to load holidays:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  // ── Duplicate date check ──────────────────────
  const isDuplicateDate = (date, excludeId = null) =>
    holidays.some(
      (h) => h.holidayDate === date && h.id !== excludeId
    );

  // ── Create ─────────────────────────────────────
  const addHoliday = async (formData) => {
    setSubmitting(true);
    setApiError("");
    try {
      await createHoliday(formData);
      console.log("✅ Holiday created");
      await loadHolidays();
      return true;
    } catch (err) {
      console.error("❌ Create error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error   ||
        "Failed to add holiday. Please try again.";
      setApiError(msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update ─────────────────────────────────────
  const editHoliday = async (id, formData) => {
    setSubmitting(true);
    setApiError("");
    try {
      await updateHoliday(id, formData);
      console.log("✅ Holiday updated");
      await loadHolidays();
      return true;
    } catch (err) {
      console.error("❌ Update error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error   ||
        "Failed to update holiday. Please try again.";
      setApiError(msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────
  const removeHoliday = async (id) => {
    try {
      await deleteHoliday(id);
      console.log("✅ Holiday deleted");
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  return {
    holidays,
    loading,
    submitting,
    apiError,
    setApiError,
    selectedYear,
    setSelectedYear,
    isDuplicateDate,
    addHoliday,
    editHoliday,
    removeHoliday,
    refresh: loadHolidays,
  };
}
