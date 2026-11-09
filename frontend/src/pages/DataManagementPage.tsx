import React, { useState } from 'react';
import {
  Database, UploadCloud, Download, FileText, CheckCircle2,
  AlertTriangle, RefreshCw, Trash2, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export const DataManagementPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'researchers' | 'publications'>('researchers');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewResult(null);
      setSuccessMessage(null);

      // Auto trigger preview
      try {
        setPreviewLoading(true);
        const preview = await api.previewResearchersCSV(file);
        setPreviewResult(preview);
      } catch (err: any) {
        alert(err.message || 'Error parsing CSV file');
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    try {
      setConfirmLoading(true);
      const res = await api.confirmResearchersCSV(selectedFile);
      setSuccessMessage(res.message);
      setPreviewResult(null);
      setSelectedFile(null);
    } catch (err: any) {
      alert(err.message || 'Error confirming import');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDownloadTemplate = (type: string) => {
    window.open(`/api/data/templates/${type}`, '_blank');
  };

  const handleExport = (type: string) => {
    window.open(`/api/data/export/${type}`, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Data Management</h2>
        <p className="text-xs text-slate-500">
          Upload and validate institutional CSV records, export datasets, and download standardized CSV templates.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Templates & Export Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Template Downloads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-100 pb-2">
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Download Standardized CSV Templates</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Use official university schema templates with pre-configured header columns for faculty profiles and publication abstracts.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => handleDownloadTemplate('researchers')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Faculty CSV Template
            </button>
            <button
              onClick={() => handleDownloadTemplate('publications')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" /> Publications CSV Template
            </button>
          </div>
        </div>

        {/* Database Record Export */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-100 pb-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Export Institutional Records</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Export all stored researcher profiles, publication abstracts, and cross-indexing metadata as clean CSV files.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => handleExport('researchers')}
              className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-semibold text-indigo-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export All Faculty CSV
            </button>
            <button
              onClick={() => handleExport('publications')}
              className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold text-emerald-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Publications CSV
            </button>
          </div>
        </div>
      </div>

      {/* CSV Import Upload Zone */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-2">
          Upload Institutional CSV Data
        </h3>

        <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 rounded-xl p-8 text-center transition-colors">
          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">
            {selectedFile ? selectedFile.name : 'Choose a CSV file to upload and preview'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Accepts UTF-8 encoded .csv files up to 10MB. Automatically validates header columns and duplicate emails.
          </p>
          <label className="mt-4 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs cursor-pointer transition-all shadow-sm">
            Select CSV File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Loading Preview */}
        {previewLoading && (
          <div className="p-6 text-center text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" />
            Validating CSV columns, detecting duplicate records, and verifying datatypes...
          </div>
        )}

        {/* Preview Results Table */}
        {previewResult && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 text-xs">Import Preview & Validation Report</h4>
                <p className="text-[11px] text-slate-500">
                  Total Rows: {previewResult.total_rows} &bull; Valid Rows: {previewResult.valid_rows_count} &bull; Errors: {previewResult.error_count}
                </p>
              </div>
              <button
                onClick={handleConfirmImport}
                disabled={confirmLoading || previewResult.valid_rows_count === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-sm flex items-center gap-1.5"
              >
                {confirmLoading ? 'Importing...' : 'Confirm & Commit Import'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Error alerts if any */}
            {previewResult.errors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-1">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Validation Warnings Detected:
                </span>
                <ul className="text-[10px] space-y-0.5 list-disc pl-4 text-rose-800">
                  {previewResult.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data rows preview */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">School Code</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewResult.preview_data.map((row: any) => (
                    <tr key={row.row_index} className={row.is_valid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                      <td className="py-2 px-3 font-mono text-[11px]">{row.row_index}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{row.name}</td>
                      <td className="py-2 px-3 text-slate-600">{row.email}</td>
                      <td className="py-2 px-3 font-mono">{row.school_code}</td>
                      <td className="py-2 px-3 text-slate-600">{row.designation}</td>
                      <td className="py-2 px-3">
                        {row.is_valid ? (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                            Valid
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold">
                            {row.errors[0] || 'Invalid'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
