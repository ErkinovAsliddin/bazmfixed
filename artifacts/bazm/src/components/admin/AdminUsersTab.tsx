import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminListUsers,
  getAdminListUsersQueryKey,
  useAdminUpdateUserRole,
  AdminUserRoleUpdateRole,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const ROLES = Object.values(AdminUserRoleUpdateRole);

export function AdminUsersTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: users, isLoading } = useAdminListUsers({
    query: { queryKey: getAdminListUsersQueryKey(), retry: false },
  });
  const update = useAdminUpdateUserRole();

  const changeRole = (id: number, role: string) => {
    update.mutate(
      { id, data: { role: role as (typeof ROLES)[number] } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getAdminListUsersQueryKey(),
          });
          toast({ title: "Role updated" });
        },
        onError: () =>
          toast({ title: "Failed to update role", variant: "destructive" }),
      },
    );
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/50" />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-40">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).map((u) => (
              <TableRow key={u.id} data-testid={`admin-user-${u.id}`}>
                <TableCell className="font-medium text-foreground">
                  {u.name}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Select
                    value={u.role}
                    onValueChange={(v) => changeRole(u.id, v)}
                    disabled={update.isPending}
                  >
                    <SelectTrigger
                      className="h-8"
                      data-testid={`user-role-${u.id}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
