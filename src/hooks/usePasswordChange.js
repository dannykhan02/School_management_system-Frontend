// src/hooks/usePasswordChange.js
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export const usePasswordChange = () => {
  const { changePassword } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await changePassword(passwordData);
      if (result.success) {
        toast.success("Password changed successfully");
        setPasswordData({
          current_password: "",
          new_password: "",
          new_password_confirmation: ""
        });
        setShowPasswordForm(false);
      } else {
        setErrors(result.errors || { general: result.error });
        toast.error(result.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Password change error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPasswordData({
      current_password: "",
      new_password: "",
      new_password_confirmation: ""
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
  };

  return {
    showPasswordForm,
    setShowPasswordForm,
    passwordData,
    setPasswordData,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    errors,
    isSubmitting,
    handlePasswordChange,
    resetForm
  };
};