import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaGavel, FaMapMarkerAlt, FaSave, FaStickyNote } from 'react-icons/fa';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';

const AddCourtForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
 const navigate = useNavigate();  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'courts'), {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({ name: '', district: '', notes: '' });
      }, 1500);
    } catch (error) {
      console.error('Error adding court: ', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-lg"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FaGavel className="mr-2 text-blue-500" /> Add New Court
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField
            label="Court Name"
            name="name"
            Icon={FaGavel}
            value={formData.name}
            onChange={handleChange}
            required
          />

          <FormField
            label="District (Optional)"
            name="district"
            Icon={FaMapMarkerAlt}
            value={formData.district}
            onChange={handleChange}
          />
        </div>

      

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center disabled:opacity-70"
          >
            {loading ? 'Saving...' : (
              <>
                <FaSave className="mr-2" /> Save Court
              </>
            )}
          </motion.button>
           <motion.button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-8 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-all duration-200 flex items-center justify-center mx-auto cursor-pointer"
                      >
                        <FiChevronLeft className="mr-1" />
                        Go Back
                      </motion.button>
        </div>
      </form>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center"
        >
          ✓ Court added successfully!
        </motion.div>
      )}
    </motion.div>
  );
};

const FormField = ({ label, name, type = 'text', Icon, value, onChange, required }) => (
  <div>
    <label className="block text-gray-700 text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Icon />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 ${Icon ? 'pl-10' : ''} py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        required={required}
      />
    </div>
  </div>
);

export default AddCourtForm;
