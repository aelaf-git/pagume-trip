import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import { getUsers, setUserVerified } from "../../services/adminService";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getUsers());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleVerify = async (user) => {
    try {
      await setUserVerified(user.id, !user.is_verified);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage portal user accounts" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Card>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Verified</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4">{u.full_name || "—"}</td>
                    <td className="py-3 pr-4">{u.email}</td>
                    <td className="py-3 pr-4">{u.role}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={u.is_verified ? "green" : "amber"}>
                        {u.is_verified ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {u.role !== "ADMIN" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => toggleVerify(u)}
                        >
                          {u.is_verified ? "Unverify" : "Verify"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
