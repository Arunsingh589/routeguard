import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Wind, CloudRain, Snowflake, Scale, CheckCircle2 } from 'lucide-react';

export default function RiskRubricModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: 8,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  Weather & Load Risk Evaluation Matrix
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Official assessment risk rules and load weight escalation logic
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.88rem', color: '#38bdf8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wind size={16} /> Checkpoint Weather Condition Thresholds
            </h4>
            <table className="rubric-table">
              <thead>
                <tr>
                  <th>Condition</th>
                  <th style={{ color: '#34d399' }}>Low (1)</th>
                  <th style={{ color: '#fbbf24' }}>Moderate (2)</th>
                  <th style={{ color: '#fb923c' }}>High (3)</th>
                  <th style={{ color: '#f87171' }}>Severe (4)</th>
                  <th style={{ color: '#c084fc' }}>No Travel (5)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Wind Speed</strong></td>
                  <td>&lt; 25 mph</td>
                  <td>25 – 34 mph</td>
                  <td>35 – 44 mph</td>
                  <td>45 – 54 mph</td>
                  <td style={{ color: '#fca5a5', fontWeight: 600 }}>&ge; 55 mph</td>
                </tr>
                <tr>
                  <td><strong>Rain Rate</strong></td>
                  <td>&lt; 0.10 in/hr</td>
                  <td>0.10 – 0.25</td>
                  <td>0.25 – 0.50</td>
                  <td>0.50 – 1.00</td>
                  <td style={{ color: '#fca5a5', fontWeight: 600 }}>&gt; 1.00 in/hr</td>
                </tr>
                <tr>
                  <td><strong>Snow Rate</strong></td>
                  <td>&lt; 0.50 in/hr</td>
                  <td>0.50 – 1.00</td>
                  <td>1.00 – 2.00</td>
                  <td>2.00 – 3.00</td>
                  <td style={{ color: '#fca5a5', fontWeight: 600 }}>&gt; 3.00 in/hr</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.88rem', color: '#f59e0b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Scale size={16} /> Truck Load Weight Escalation Rules
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.84rem',
                color: '#fca5a5',
              }}>
                <strong>Rule 1:</strong> &ge; 55 mph Wind &rarr; <strong>No Travel</strong> for any load weight.
              </div>
              <div style={{
                background: 'rgba(249, 115, 22, 0.12)',
                border: '1px solid rgba(249, 115, 22, 0.35)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.84rem',
                color: '#fdba74',
              }}>
                <strong>Rule 2:</strong> 45–54 mph Wind + &gt; 30,000 lb Load &rarr; Elevated to <strong>No Travel</strong>.
              </div>
              <div style={{
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.84rem',
                color: '#fde047',
              }}>
                <strong>Rule 3:</strong> 35–44 mph Wind + &gt; 40,000 lb Load &rarr; Elevated to <strong>Severe</strong>.
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', color: '#10b981', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} /> Route Recommendation Hierarchy
            </h4>
            <ol style={{ paddingLeft: 20, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.7' }}>
              <li><strong>Fewest Severe miles</strong> (along with 0 No-Travel hazardous miles)</li>
              <li><strong>Fewest High miles</strong></li>
              <li><strong>Lowest average corridor risk score</strong> (1.00 to 5.00)</li>
              <li><strong>Shortest travel duration</strong></li>
            </ol>
          </div>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              className="btn-glass"
              style={{ background: '#1e293b', padding: '8px 18px', color: '#fff' }}
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
