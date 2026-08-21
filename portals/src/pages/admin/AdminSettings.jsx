import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { getSettings, upsertSetting } from "../../services/adminService";

const DEFAULT_KEYS = [
  { key: "platform_name", label: "Platform name", placeholder: "Pagume Trip" },
  {
    key: "support_email",
    label: "Support email",
    placeholder: "support@pagume.et",
  },
  {
    key: "marketplace_enabled",
    label: "Marketplace enabled",
    placeholder: "true",
  },
];

export default function AdminSettings() {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    getSettings()
      .then((rows) => {
        const map = {};
        for (const row of rows) {
          map[row.key] =
            typeof row.value === "object" && row.value !== null && "text" in row.value
              ? row.value.text
              : JSON.stringify(row.value ?? "");
        }
        setValues(map);
      })
      .catch((e) => setError(e.message));
  }, []);

  const save = async (key) => {
    setSaving(key);
    setError(null);
    setNotice(null);
    try {
      const raw = values[key] ?? "";
      let value;
      if (raw === "true" || raw === "false") {
        value = { enabled: raw === "true" };
      } else {
        value = { text: raw };
      }
      await upsertSetting(key, value);
      setNotice(`Saved ${key}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform key/value settings stored in the database"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {notice && <p className="text-sm text-green-600">{notice}</p>}
      <Card>
        <div className="space-y-4">
          {DEFAULT_KEYS.map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label={label}
                  value={values[key] ?? ""}
                  placeholder={placeholder}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [key]: e.target.value }))
                  }
                />
              </div>
              <Button
                loading={saving === key}
                onClick={() => save(key)}
                className="sm:mb-0"
              >
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
