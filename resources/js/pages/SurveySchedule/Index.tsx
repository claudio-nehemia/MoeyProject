import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

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
  survey_users: SurveyUser[];
}

interface Props {
  orders: Order[];
  surveyUsers: SurveyUser[];
}

/* ================= COMPONENT ================= */
export default function Index({ orders, surveyUsers }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tanggalSurvey, setTanggalSurvey] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  useEffect(() => {
    setMounted(true);
    setSidebarOpen(window.innerWidth >= 1024);
  }, []);

  const toggleUser = (id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    // Pre-fill data jika sudah ada jadwal
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
              {orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {order.nama_project}
                    </h3>
                    <p className="text-sm text-stone-600">
                      {order.company_name} •{' '}
                      {order.customer_name}
                    </p>

                    {/* STATUS */}
                    {order.tanggal_survey && (
                      <div className="mt-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                          ✔ Survey dijadwalkan (
                          {new Date(
                            order.tanggal_survey,
                          ).toLocaleDateString('id-ID')}
                          )
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          Tim: {order.survey_users.map(u => u.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ACTION - SELALU MUNCUL */}
                  <button
                    onClick={() => openModal(order)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                  >
                    {order.tanggal_survey ? 'Edit Schedule' : 'Response Survey'}
                  </button>
                </div>
              ))}
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
                {selectedOrder.tanggal_survey ? 'Edit' : 'Response'} Survey
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
              <div className="space-y-2 mb-6">
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
    </>
  );
}