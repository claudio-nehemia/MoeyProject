import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ExtendModal from '@/components/ExtendModal';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
  const [taskResponses, setTaskResponses] = useState<Record<number, any>>({});
  const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: any } | null>(null);

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

          {orders.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              Tidak ada order.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const hasResponse = !!order.survey_response_time;
                const hasPmResponse = !!order.pm_survey_response_time;
                const showScheduleButton = hasResponse;
                const taskResponse = taskResponses[order.id];

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {order.nama_project}
                        </h3>
                        <p className="text-sm text-stone-600">
                          {order.company_name} • {order.customer_name}
                        </p>
                      </div>
                    </div>

                    {/* RESPONSE STATUS */}
                    <div className="space-y-2 mb-3">
                      {/* Regular Response */}
                      {hasResponse && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                            ✓ Response
                          </span>
                          <span className="text-stone-600">
                            oleh <strong>{order.survey_response_by}</strong> pada{' '}
                            {formatDateTime(order.survey_response_time)}
                          </span>
                        </div>
                      )}

                      {/* PM Response */}
                      {hasPmResponse && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                            ✓ PM Response
                          </span>
                          <span className="text-stone-600">
                            oleh <strong>{order.pm_survey_response_by}</strong> pada{' '}
                            {formatDateTime(order.pm_survey_response_time)}
                          </span>
                        </div>
                      )}

                      {/* Survey Schedule Status */}
                      {order.tanggal_survey && (
                        <div className="pt-2 border-t">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                            📅 Survey dijadwalkan (
                            {new Date(order.tanggal_survey).toLocaleDateString('id-ID')}
                            )
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            Tim: {order.survey_users.map(u => u.name).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Deadline & Minta Perpanjangan - hanya setelah response */}
                    {taskResponse &&
                      taskResponse.status !== 'selesai' &&
                      (
                      <div className="mb-3">
                        <div className="p-3 rounded border border-yellow-200 bg-yellow-50 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium text-yellow-800">
                              Deadline Survey Schedule
                            </p>
                            <p className="text-sm font-semibold text-yellow-900">
                              {formatDeadline(taskResponse.deadline)}
                            </p>
                            {taskResponse.extend_time > 0 && (
                              <p className="mt-1 text-xs text-orange-600">
                                Perpanjangan: {taskResponse.extend_time}x
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setShowExtendModal({ orderId: order.id, tahap: 'survey_schedule', isMarketing: false, taskResponse })}
                            className="px-3 py-1.5 bg-orange-500 text-white rounded-md text-xs font-medium hover:bg-orange-600 transition-colors"
                          >
                            Minta Perpanjangan
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-2 flex-wrap">
                      {/* Response Button - Always show if not yet responded */}
                      {isNotKepalaMarketing && !hasResponse && (
                        <button
                          onClick={() => handleResponse(order.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                        >
                          Response
                        </button>
                      )}

                      {/* PM Response Button - Only for Kepala Marketing, show if not yet PM responded */}
                      {isKepalaMarketing && !hasPmResponse && (
                        <button
                          onClick={() => handlePmResponse(order.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                        >
                          Marketing Response
                        </button>
                      )}

                      {/* Schedule Button - Only show after response */}
                      {showScheduleButton && (
                        <button
                          onClick={() => openModal(order)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                        >
                          {order.tanggal_survey ? 'Edit Schedule' : 'Isi Tanggal Survey'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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