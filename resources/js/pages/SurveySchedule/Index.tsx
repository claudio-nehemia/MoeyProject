import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ExtendModal from '@/components/ExtendModal';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

/* ================= TYPES ================= */
interface SurveyUser {
  id: number;
  name: string;
  email?: string;
}

interface Order {
  id: number;
  nama_project: string;
  company_name: string;
  customer_name: string;
  tanggal_survey: string | null;
  survey_response_time: string | null;
  survey_response_by: string | null;
  pm_survey_response_time: string | null;
  pm_survey_response_by: string | null;
  survey_users: SurveyUser[];
}

interface TaskResponse {
  status: string;
  deadline: string | null;
  extend_time: number;
  update_data_time?: string | null;
}

interface Props {
  orders: Order[];
  surveyUsers: SurveyUser[];
  isKepalaMarketing: boolean;
}

/* ================= COMPONENT ================= */
export default function Index({ orders, surveyUsers, isKepalaMarketing }: Props) {
  const isNotKepalaMarketing = !isKepalaMarketing;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tanggalSurvey, setTanggalSurvey] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [taskResponses, setTaskResponses] = useState<Record<number, TaskResponse>>({});
  const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');

  const filteredOrders = useMemo(() =>
    orders.filter(order => {
      // Status filter
      let meetsStatus = true;
      if (statusFilter === 'pending_response') {
        meetsStatus = !order.survey_response_time;
      } else if (statusFilter === 'pending_schedule') {
        meetsStatus = !!order.survey_response_time && !order.tanggal_survey;
      } else if (statusFilter === 'scheduled') {
        meetsStatus = !!order.tanggal_survey;
      }

      if (!meetsStatus) return false;

      return (
        order.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }),
    [orders, searchQuery, statusFilter]
  );

  useEffect(() => {
    setMounted(true);
    setSidebarOpen(window.innerWidth >= 1024);
  }, []);

  // Fetch task response untuk semua order (tahap: survey_schedule)
  useEffect(() => {
    orders.forEach((order) => {
      axios
        .get(`/task-response/${order.id}/survey_schedule`)
        .then((res) => {
          if (res.data) {
            setTaskResponses((prev) => ({ ...prev, [order.id]: res.data }));
          }
        })
        .catch((err) => {
          if (err.response?.status !== 404) {
            console.error('Error fetching task response (survey_schedule):', err);
          }
        });
    });
  }, [orders]);

  const toggleUser = (id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    if (order.tanggal_survey) {
      setTanggalSurvey(order.tanggal_survey);
      setSelectedUsers(order.survey_users.map(u => u.id));
    } else {
      setTanggalSurvey('');
      setSelectedUsers([]);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setTanggalSurvey('');
    setSelectedUsers([]);
  };

  const submitSurvey = () => {
    if (!selectedOrder || !tanggalSurvey || selectedUsers.length === 0) {
      alert('Tanggal survey dan minimal 1 member wajib diisi.');
      return;
    }

    router.post(
      `/survey-schedule/${selectedOrder.id}`,
      {
        tanggal_survey: tanggalSurvey,
        survey_schedule_users: selectedUsers,
      },
      {
        preserveScroll: true,
        onSuccess: () => closeModal(),
      },
    );
  };

  const handleResponse = (orderId: number) => {
    router.post(`/survey-schedule/${orderId}/response`, {}, {
      preserveScroll: true,
    });
  };

  const handlePmResponse = (orderId: number) => {
    router.post(`/pm-response/survey-schedule/${orderId}`, {}, {
      preserveScroll: true,
    });
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '';
    return new Date(dateTime).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDeadline = (value: string | null | undefined) => {
    if (value == null || value === '') return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!mounted) return null;

  return (
    <>
      <Head title="Survey Schedule" />
      <Navbar />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ================= CONTENT ================= */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : ''
        } pt-16`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Survey Schedule</h1>
          <p className="text-stone-600 mb-6">
            Order yang perlu dijadwalkan survey
          </p>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama project, company, atau customer..."
                className="block w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-[180px]"
              >
                <option value="semua">Semua Status</option>
                <option value="pending_response">Belum Response</option>
                <option value="pending_schedule">Belum Dijadwalkan</option>
                <option value="scheduled">Sudah Dijadwalkan</option>
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-stone-500 bg-white rounded-xl border border-stone-200">
              Tidak ada order yang perlu dijadwalkan survey.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                <table className="w-full whitespace-nowrap text-left text-sm">
                    <thead className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="px-5 py-4">Project / Client Info</th>
                            <th className="px-5 py-4">Status Survey</th>
                            <th className="px-5 py-4">Deadline Info</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredOrders.map(order => {
                            const hasResponse = !!order.survey_response_time;
                            const hasPmResponse = !!order.pm_survey_response_time;
                            const showScheduleButton = hasResponse;
                            const taskResponse = taskResponses[order.id];

                            return (
                                <tr key={order.id} className="transition-colors hover:bg-slate-50/50">
                                    {/* Project Info */}
                                    <td className="px-5 py-4 align-top">
                                        <div className="font-semibold text-slate-800 mb-1 max-w-[200px] whitespace-normal break-words leading-tight">
                                            {order.nama_project}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                                            <span className="truncate max-w-[150px] font-medium text-slate-700">{order.company_name}</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[150px]">{order.customer_name}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5 mt-2">
                                            {hasResponse && (
                                                <div className="inline-flex flex-col gap-0.5 px-2 py-1.5 bg-green-50 border border-green-200 rounded max-w-fit">
                                                    <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">✓ Response: {order.survey_response_by}</span>
                                                    <span className="text-[10px] text-green-600">{formatDateTime(order.survey_response_time)}</span>
                                                </div>
                                            )}
                                            {hasPmResponse && (
                                                <div className="inline-flex flex-col gap-0.5 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded max-w-fit mt-1">
                                                    <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">✓ PM Res: {order.pm_survey_response_by}</span>
                                                    <span className="text-[10px] text-blue-600">{formatDateTime(order.pm_survey_response_time)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Status Survey */}
                                    <td className="px-5 py-4 align-top">
                                        <div className="space-y-2">
                                            {order.tanggal_survey ? (
                                                <div className="max-w-[220px] rounded border border-indigo-200 bg-indigo-50 p-2 whitespace-normal">
                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 mb-1">
                                                        <span>📅</span>
                                                        <span>Dijadwalkan: {new Date(order.tanggal_survey).toLocaleDateString('id-ID')}</span>
                                                    </div>
                                                    <p className="text-[10px] text-indigo-600/80 leading-tight">
                                                        <span className="font-semibold">Tim:</span> {order.survey_users.map(u => u.name).join(', ')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="inline-flex rounded border border-stone-200 bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-500">
                                                    Belum dijadwalkan
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Deadline */}
                                    <td className="px-5 py-4 align-top">
                                        {taskResponse && 
                                         taskResponse.status !== 'selesai' && 
                                         taskResponse.status !== 'telat_submit' && 
                                         !taskResponse.update_data_time ? (
                                            <div className="inline-flex max-w-[200px] flex-col items-start gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1.5 w-full">
                                                <p className="text-[10px] font-bold text-yellow-800">Deadline Survey Schedule</p>
                                                <p className="text-[11px] font-semibold text-yellow-900">{formatDeadline(taskResponse.deadline)}</p>
                                                {taskResponse.extend_time > 0 && (
                                                    <p className="bg-yellow-200 px-1 py-0.5 rounded text-[9px] font-bold text-yellow-800">Ext: {taskResponse.extend_time}x</p>
                                                )}
                                                <button
                                                    onClick={() => setShowExtendModal({ orderId: order.id, tahap: 'survey_schedule', isMarketing: false, taskResponse })}
                                                    className="mt-1 w-full rounded bg-orange-500 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-orange-600 shadow-sm text-center"
                                                >Minta Extend</button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-stone-400 italic">Tidak ada deadline</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4 align-top text-right">
                                        <div className="flex flex-col items-end gap-1.5">
                                            {showScheduleButton && (
                                                <button
                                                    onClick={() => openModal(order)}
                                                    className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 text-center"
                                                >
                                                    {order.tanggal_survey ? '📅 Edit Schedule' : '📅 Isi Tanggal Survey'}
                                                </button>
                                            )}

                                            {isKepalaMarketing && !hasPmResponse && (
                                                <button
                                                    onClick={() => handlePmResponse(order.id)}
                                                    className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-700 text-center mt-1"
                                                >
                                                    Marketing Response
                                                </button>
                                            )}

                                            {isNotKepalaMarketing && !hasResponse && (
                                                <button
                                                    onClick={() => handleResponse(order.id)}
                                                    className="w-full rounded-md bg-green-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-green-700 text-center mt-1"
                                                >
                                                    ✓ Response
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">
                {selectedOrder.tanggal_survey ? 'Edit' : 'Isi'} Tanggal Survey
              </h2>
              <p className="text-stone-600 mb-6">
                {selectedOrder.nama_project}
              </p>

              {/* TANGGAL */}
              <label className="block mb-2 font-semibold">
                Tanggal Survey
              </label>
              <input
                type="date"
                value={tanggalSurvey}
                onChange={e => setTanggalSurvey(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 mb-4"
              />

              {/* USER PICKER */}
              <label className="block mb-2 font-semibold">Tim Survey</label>
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {surveyUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`cursor-pointer rounded-lg border p-3 transition ${
                      selectedUsers.includes(user.id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'hover:border-stone-300'
                    }`}
                  >
                    <div className="font-medium">{user.name}</div>
                    {user.email && (
                      <div className="text-sm text-stone-500">
                        {user.email}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  onClick={submitSurvey}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Modal */}
      {showExtendModal && (
        <ExtendModal
          orderId={showExtendModal.orderId}
          tahap={showExtendModal.tahap}
          taskResponse={showExtendModal.taskResponse}
          isMarketing={showExtendModal.isMarketing}
          onClose={() => setShowExtendModal(null)}
        />
      )}
    </>
  );
}