import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Users } from "lucide-react";

export function RoleSwitcher({ currentRole, onRoleChange }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background">
      <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <Select value={currentRole} onValueChange={(value) => onRoleChange(value)}>
        <SelectTrigger className="w-[200px] border-0 focus:ring-0 focus:ring-offset-0 h-auto p-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="client">Client</SelectItem>
          <SelectItem value="landowner">Landowner</SelectItem>
          <SelectItem value="lro">Land Registry Officer</SelectItem>
          <SelectItem value="notary">Notary Officer</SelectItem>
          <SelectItem value="admin">Super Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
