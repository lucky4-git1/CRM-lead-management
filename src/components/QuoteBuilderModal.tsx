'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, DollarSign, CheckCircle } from 'lucide-react';

interface QuoteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  dealTitle: string;
  onSuccess: () => void;
}

export function QuoteBuilderModal({
  isOpen,
  onClose,
  dealId,
  dealTitle,
  onSuccess,
}: QuoteBuilderModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [title, setTitle] = useState(`${dealTitle} - Enterprise Proposal`);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('Payment terms: Net 30 days. Includes standard SLA and dedicated account manager.');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        if (d.products) {
          setProducts(d.products);
          if (d.products.length > 0 && lineItems.length === 0) {
            setLineItems([
              {
                productId: d.products[0].id,
                name: d.products[0].name,
                sku: d.products[0].sku,
                unitPrice: d.products[0].unitPrice,
                qty: 10,
              },
            ]);
          }
        }
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddProduct = (product: any) => {
    setLineItems((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.unitPrice,
        qty: 1,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateQty = (index: number, qty: number) => {
    setLineItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, qty: Math.max(1, qty) } : item))
    );
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const total = Math.max(0, subtotal - discount + tax);

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          title,
          lineItems,
          discount,
          tax,
          notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to create quote');

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Generate CPQ Quote & Proposal</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSaveQuote} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quote Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Line items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-700">Line Items & Products</label>
              <div className="flex items-center gap-1">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddProduct(p)}
                    className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-blue-100 hover:text-blue-700"
                  >
                    + {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 w-20">Unit ($)</th>
                    <th className="p-2.5 w-20">Qty</th>
                    <th className="p-2.5 w-24">Total</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-2.5">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                      </td>
                      <td className="p-2.5 text-slate-700">${item.unitPrice.toLocaleString()}</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateQty(idx, parseInt(e.target.value, 10) || 1)}
                          className="w-16 rounded border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        ${(item.unitPrice * item.qty).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing calculations */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contract Notes / Terms</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Discount ($):</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 rounded border border-slate-200 px-2 py-0.5 text-right font-mono"
                />
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Value:</span>
                <span className="text-emerald-700">${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || lineItems.length === 0}
              className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Issue Official Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
