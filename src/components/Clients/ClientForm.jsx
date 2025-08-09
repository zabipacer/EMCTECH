import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import { db } from '../../firebase/firebase';// Adjust your firebase config path
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddClientForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    location: '',
    address: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'clients'), {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({
          name: '',
          contactPerson: '',
          email: '',
          phone: '',
          location: '',
          address: '',
          notes: ''
        });
      }, 1500);
    } catch (error) {
      console.error("Error adding client: ", error);
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
        <FaUser className="mr-2 text-blue-500" /> Add New Client
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-4">
            <FormField 
              label="Client Name" 
              name="name" 
              Icon={FaUser}
              value={formData.name}
              onChange={handleChange}
              required
            />
            
            <FormField 
              label="Contact Person" 
              name="contactPerson" 
              Icon={FaUser}
              value={formData.contactPerson}
              onChange={handleChange}
            />
            
            <FormField 
              label="Email" 
              name="email" 
              type="email"
              Icon={FaEnvelope}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-4">
            <FormField 
              label="Phone" 
              name="phone" 
              type="tel"
              Icon={FaPhone}
              value={formData.phone}
              onChange={handleChange}
            />
            
            <FormField 
              label="Location" 
              name="location" 
              Icon={FaMapMarkerAlt}
              value={formData.location}
              onChange={handleChange}
            />
            
            <FormField 
              label="Address" 
              name="address" 
              type="textarea"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Enter any additional information"
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
            {loading ? (
              'Saving...'
            ) : (
              <>
                <FaSave className="mr-2" /> Save Client
              </>
            )}
          </motion.button>
        </div>
      </form>
      
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center"
        >
          ✓ Client added successfully!
        </motion.div>
      )}
    </motion.div>
  );
};

// Reusable form field component
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
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full px-4 ${Icon ? 'pl-10' : ''} py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          required={required}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full px-4 ${Icon ? 'pl-10' : ''} py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          required={required}
        />
      )}
    </div>
  </div>
);

export default AddClientForm;