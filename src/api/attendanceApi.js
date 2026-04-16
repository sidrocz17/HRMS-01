// src/api/attendanceApi.js

import axios from "axios";

const BASE_URL = "/api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── POST /attendance/punch-in ─────────────────
export const punchIn = async () => {
  // TODO: integrate API
  // const response = await axios.post(`${BASE_URL}/attendance/punch-in`, {}, authHeaders());
  // return response.data;

  // ── Placeholder ──────────────────────────────
  return {
    id: `att-${Date.now()}`,
    inTime: new Date().toISOString(),
    outTime: null,
    date: new Date().toLocaleDateString("en-GB"),
  };
};

// ── POST /attendance/punch-out ────────────────
export const punchOut = async () => {
  // TODO: integrate API
  // const response = await axios.post(`${BASE_URL}/attendance/punch-out`, {}, authHeaders());
  // return response.data;

  // ── Placeholder ──────────────────────────────
  return {
    outTime: new Date().toISOString(),
  };
};

// ── GET /attendance/my ────────────────────────
//    Returns logged-in user's own attendance history
export const getAttendance = async () => {
  // TODO: integrate API
  // const response = await axios.get(`${BASE_URL}/attendance/my`, authHeaders());
  // return response.data;

  // ── Placeholder ──────────────────────────────
  return generateMockHistory(false);
};

// ── GET /attendance/all ───────────────────────
//    HR / ADMIN: returns all employees' attendance
export const getAllAttendance = async () => {
  // TODO: integrate API
  // const response = await axios.get(`${BASE_URL}/attendance/all`, authHeaders());
  // return response.data;

  // ── Placeholder ──────────────────────────────
  return generateMockHistory(true);
};

// ── Mock data generator ───────────────────────
const EMPLOYEES = [
  "Riya Sharma",
  "Arjun Mehta",
  "Pooja Nair",
  "Kiran Das",
  "Sneha Rao",
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${pad(hh)}:${pad(m)} ${ampm}`;
}

function calcHours(inISO, outISO) {
  if (!inISO || !outISO) return "—";
  const diff = (new Date(outISO) - new Date(inISO)) / 1000;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${pad(m)}m`;
}

function generateMockHistory(includeEmployee) {
  const rows = [];
  const today = new Date();

  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const inH = 9 + Math.floor(Math.random() * 2);
    const inM = Math.floor(Math.random() * 30);
    const inDate = new Date(d);
    inDate.setHours(inH, inM, 0);

    const outH = 17 + Math.floor(Math.random() * 2);
    const outM = Math.floor(Math.random() * 30);
    const outDate = new Date(d);
    outDate.setHours(outH, outM, 0);

    const row = {
      id: `att-${i}`,
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      inTime: formatTime(inDate),
      outTime: formatTime(outDate),
      workingHours: calcHours(inDate.toISOString(), outDate.toISOString()),
      inISO: inDate.toISOString(),
      outISO: outDate.toISOString(),
    };

    if (includeEmployee) {
      row.employeeName = EMPLOYEES[i % EMPLOYEES.length];
    }

    rows.push(row);
  }

  return rows;
}
