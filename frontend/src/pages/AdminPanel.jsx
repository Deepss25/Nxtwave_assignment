import { useState, useEffect } from 'react';
import {
  adminGetCourts,
  adminCreateCourt,
  adminUpdateCourt,
  adminDeleteCourt,
  adminGetEquipment,
  adminCreateEquipment,
  adminUpdateEquipment,
  adminDeleteEquipment,
  adminGetCoaches,
  adminCreateCoach,
  adminUpdateCoach,
  adminDeleteCoach,
  adminGetPricingRules,
  adminCreatePricingRule,
  adminUpdatePricingRule,
  adminDeletePricingRule,
} from '../services/api';
import './AdminPanel.css';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('courts');
  const [courts, setCourts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case 'courts':
          const courtsRes = await adminGetCourts();
          setCourts(courtsRes.data);
          break;
        case 'equipment':
          const equipmentRes = await adminGetEquipment();
          setEquipment(equipmentRes.data);
          break;
        case 'coaches':
          const coachesRes = await adminGetCoaches();
          setCoaches(coachesRes.data);
          break;
        case 'pricing':
          const rulesRes = await adminGetPricingRules();
          setPricingRules(rulesRes.data);
          break;
      }
    } catch (err) {
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case 'courts':
          await adminCreateCourt(formData);
          break;
        case 'equipment':
          await adminCreateEquipment(formData);
          break;
        case 'coaches':
          await adminCreateCoach(formData);
          break;
        case 'pricing':
          await adminCreatePricingRule(formData);
          break;
      }
      setFormData({});
      setEditing(null);
      loadData();
    } catch (err) {
      alert('Failed to create: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      setLoading(true);
      switch (activeTab) {
        case 'courts':
          await adminUpdateCourt(id, formData);
          break;
        case 'equipment':
          await adminUpdateEquipment(id, formData);
          break;
        case 'coaches':
          await adminUpdateCoach(id, formData);
          break;
        case 'pricing':
          await adminUpdatePricingRule(id, formData);
          break;
      }
      setFormData({});
      setEditing(null);
      loadData();
    } catch (err) {
      alert('Failed to update: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      setLoading(true);
      switch (activeTab) {
        case 'courts':
          await adminDeleteCourt(id);
          break;
        case 'equipment':
          await adminDeleteEquipment(id);
          break;
        case 'coaches':
          await adminDeleteCoach(id);
          break;
        case 'pricing':
          await adminDeletePricingRule(id);
          break;
      }
      loadData();
    } catch (err) {
      alert('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditing(item._id);
    setFormData({ ...item });
  };

  const cancelEdit = () => {
    setEditing(null);
    setFormData({});
  };

  const renderCourts = () => (
    <div className="admin-section">
      <h2>Courts</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Base Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courts.map((court) => (
            <tr key={court._id}>
              {editing === court._id ? (
                <>
                  <td>
                    <input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="indoor">Indoor</option>
                      <option value="outdoor">Outdoor</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.basePrice || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, basePrice: parseFloat(e.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.value === 'true' })
                      }
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleUpdate(court._id)}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{court.name}</td>
                  <td className="capitalize">{court.type}</td>
                  <td>${court.basePrice}</td>
                  <td>{court.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => startEdit(court)}>Edit</button>
                    <button onClick={() => handleDelete(court._id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editing === 'new' && (
        <div className="new-item-form">
          <h3>New Court</h3>
          <input
            placeholder="Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <select
            value={formData.type || ''}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="">Select Type</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>
          <input
            type="number"
            placeholder="Base Price"
            value={formData.basePrice || ''}
            onChange={(e) =>
              setFormData({ ...formData, basePrice: parseFloat(e.target.value) })
            }
          />
          <button onClick={handleCreate}>Create</button>
          <button onClick={cancelEdit}>Cancel</button>
        </div>
      )}
      {editing !== 'new' && (
        <button className="add-button" onClick={() => setEditing('new')}>
          Add Court
        </button>
      )}
    </div>
  );

  const renderEquipment = () => (
    <div className="admin-section">
      <h2>Equipment</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Rental Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((eq) => (
            <tr key={eq._id}>
              {editing === eq._id ? (
                <>
                  <td>
                    <input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="racket">Racket</option>
                      <option value="shoes">Shoes</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.quantity || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: parseInt(e.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.rentalPrice || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, rentalPrice: parseFloat(e.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.value === 'true' })
                      }
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleUpdate(eq._id)}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{eq.name}</td>
                  <td className="capitalize">{eq.type}</td>
                  <td>{eq.quantity}</td>
                  <td>${eq.rentalPrice}</td>
                  <td>{eq.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => startEdit(eq)}>Edit</button>
                    <button onClick={() => handleDelete(eq._id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editing === 'new' && (
        <div className="new-item-form">
          <h3>New Equipment</h3>
          <input
            placeholder="Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <select
            value={formData.type || ''}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="">Select Type</option>
            <option value="racket">Racket</option>
            <option value="shoes">Shoes</option>
          </select>
          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity || ''}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseInt(e.target.value) })
            }
          />
          <input
            type="number"
            placeholder="Rental Price"
            value={formData.rentalPrice || ''}
            onChange={(e) =>
              setFormData({ ...formData, rentalPrice: parseFloat(e.target.value) })
            }
          />
          <button onClick={handleCreate}>Create</button>
          <button onClick={cancelEdit}>Cancel</button>
        </div>
      )}
      {editing !== 'new' && (
        <button className="add-button" onClick={() => setEditing('new')}>
          Add Equipment
        </button>
      )}
    </div>
  );

  const renderCoaches = () => (
    <div className="admin-section">
      <h2>Coaches</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Hourly Rate</th>
            <th>Availability</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {coaches.map((coach) => (
            <tr key={coach._id}>
              {editing === coach._id ? (
                <>
                  <td>
                    <input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={formData.hourlyRate || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })
                      }
                    />
                  </td>
                  <td colSpan="2">
                    <small>Edit availability in JSON format</small>
                    <textarea
                      value={JSON.stringify(formData.availability || [], null, 2)}
                      onChange={(e) => {
                        try {
                          setFormData({
                            ...formData,
                            availability: JSON.parse(e.target.value),
                          });
                        } catch {}
                      }}
                      rows="4"
                    />
                  </td>
                  <td>
                    <button onClick={() => handleUpdate(coach._id)}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{coach.name}</td>
                  <td>{coach.email}</td>
                  <td>${coach.hourlyRate}</td>
                  <td>
                    {coach.availability?.length || 0} slot(s)
                  </td>
                  <td>{coach.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => startEdit(coach)}>Edit</button>
                    <button onClick={() => handleDelete(coach._id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editing === 'new' && (
        <div className="new-item-form">
          <h3>New Coach</h3>
          <input
            placeholder="Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="number"
            placeholder="Hourly Rate"
            value={formData.hourlyRate || ''}
            onChange={(e) =>
              setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })
            }
          />
          <textarea
            placeholder='Availability JSON: [{"dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00"}]'
            value={JSON.stringify(formData.availability || [], null, 2)}
            onChange={(e) => {
              try {
                setFormData({ ...formData, availability: JSON.parse(e.target.value) });
              } catch {}
            }}
            rows="4"
          />
          <button onClick={handleCreate}>Create</button>
          <button onClick={cancelEdit}>Cancel</button>
        </div>
      )}
      {editing !== 'new' && (
        <button className="add-button" onClick={() => setEditing('new')}>
          Add Coach
        </button>
      )}
    </div>
  );

  const renderPricingRules = () => (
    <div className="admin-section">
      <h2>Pricing Rules</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Conditions</th>
            <th>Multiplier</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pricingRules.map((rule) => (
            <tr key={rule._id}>
              {editing === rule._id ? (
                <>
                  <td>
                    <input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={formData.ruleType || ''}
                      onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                    >
                      <option value="time_range">Time Range</option>
                      <option value="day_of_week">Day of Week</option>
                      <option value="court_type">Court Type</option>
                    </select>
                  </td>
                  <td>
                    {formData.ruleType === 'time_range' && (
                      <>
                        <input
                          placeholder="Start (HH:mm)"
                          value={formData.timeRange?.start || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeRange: { ...formData.timeRange, start: e.target.value },
                            })
                          }
                        />
                        <input
                          placeholder="End (HH:mm)"
                          value={formData.timeRange?.end || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeRange: { ...formData.timeRange, end: e.target.value },
                            })
                          }
                        />
                      </>
                    )}
                    {formData.ruleType === 'day_of_week' && (
                      <input
                        placeholder="Days (0-6, comma-separated)"
                        value={formData.daysOfWeek?.join(',') || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            daysOfWeek: e.target.value.split(',').map((d) => parseInt(d.trim())),
                          })
                        }
                      />
                    )}
                    {formData.ruleType === 'court_type' && (
                      <select
                        value={formData.courtType || ''}
                        onChange={(e) => setFormData({ ...formData, courtType: e.target.value })}
                      >
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.multiplier || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, multiplier: parseFloat(e.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.value === 'true' })
                      }
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleUpdate(rule._id)}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{rule.name}</td>
                  <td className="capitalize">{rule.ruleType}</td>
                  <td>
                    {rule.ruleType === 'time_range' &&
                      `${rule.timeRange?.start} - ${rule.timeRange?.end}`}
                    {rule.ruleType === 'day_of_week' && rule.daysOfWeek?.join(', ')}
                    {rule.ruleType === 'court_type' && rule.courtType}
                  </td>
                  <td>x{rule.multiplier}</td>
                  <td>{rule.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => startEdit(rule)}>Edit</button>
                    <button onClick={() => handleDelete(rule._id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editing === 'new' && (
        <div className="new-item-form">
          <h3>New Pricing Rule</h3>
          <input
            placeholder="Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <select
            value={formData.ruleType || ''}
            onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
          >
            <option value="">Select Type</option>
            <option value="time_range">Time Range</option>
            <option value="day_of_week">Day of Week</option>
            <option value="court_type">Court Type</option>
          </select>
          {formData.ruleType === 'time_range' && (
            <>
              <input
                placeholder="Start Time (HH:mm)"
                value={formData.timeRange?.start || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timeRange: { ...formData.timeRange, start: e.target.value },
                  })
                }
              />
              <input
                placeholder="End Time (HH:mm)"
                value={formData.timeRange?.end || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timeRange: { ...formData.timeRange, end: e.target.value },
                  })
                }
              />
            </>
          )}
          {formData.ruleType === 'day_of_week' && (
            <input
              placeholder="Days (0-6, comma-separated)"
              value={formData.daysOfWeek?.join(',') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  daysOfWeek: e.target.value.split(',').map((d) => parseInt(d.trim())),
                })
              }
            />
          )}
          {formData.ruleType === 'court_type' && (
            <select
              value={formData.courtType || ''}
              onChange={(e) => setFormData({ ...formData, courtType: e.target.value })}
            >
              <option value="">Select Type</option>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
            </select>
          )}
          <input
            type="number"
            step="0.1"
            placeholder="Multiplier"
            value={formData.multiplier || ''}
            onChange={(e) =>
              setFormData({ ...formData, multiplier: parseFloat(e.target.value) })
            }
          />
          <button onClick={handleCreate}>Create</button>
          <button onClick={cancelEdit}>Cancel</button>
        </div>
      )}
      {editing !== 'new' && (
        <button className="add-button" onClick={() => setEditing('new')}>
          Add Pricing Rule
        </button>
      )}
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="container">
        <h1>Admin Panel</h1>

        <div className="tabs">
          <button
            className={activeTab === 'courts' ? 'active' : ''}
            onClick={() => setActiveTab('courts')}
          >
            Courts
          </button>
          <button
            className={activeTab === 'equipment' ? 'active' : ''}
            onClick={() => setActiveTab('equipment')}
          >
            Equipment
          </button>
          <button
            className={activeTab === 'coaches' ? 'active' : ''}
            onClick={() => setActiveTab('coaches')}
          >
            Coaches
          </button>
          <button
            className={activeTab === 'pricing' ? 'active' : ''}
            onClick={() => setActiveTab('pricing')}
          >
            Pricing Rules
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {activeTab === 'courts' && renderCourts()}
            {activeTab === 'equipment' && renderEquipment()}
            {activeTab === 'coaches' && renderCoaches()}
            {activeTab === 'pricing' && renderPricingRules()}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

