import { useParams, Navigate } from "react-router-dom";
import RegistrationWizard from "../../components/registration/RegistrationWizard";
import { PROVIDER_CATEGORIES } from "../../constants/providerCategories";

export default function Register() {
  const { providerType } = useParams();

  if (!PROVIDER_CATEGORIES[providerType]) {
    return <Navigate to="/register" replace />;
  }

  return <RegistrationWizard category={providerType} />;
}
