import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUserSessions, parseUserAgent } from "@/hooks/useAdminUsers";
import { Monitor, Smartphone, Tablet, Globe, Clock, User } from "lucide-react";
import { format } from "date-fns";

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className="h-4 w-4" />;
    case "tablet":
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

export function UserSessionsCard() {
  const { data: sessions, isLoading } = useAdminUserSessions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Sessions & Device Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          User Sessions & Device Tracking
        </CardTitle>
        <CardDescription>
          Monitor user login activity, devices, and browser information for security
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {!sessions || sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mb-2" />
              <p>No login sessions recorded yet</p>
              <p className="text-sm">Sessions will appear here when users log in</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  // If browser/os not parsed in DB, parse from user_agent
                  const parsed = session.browser && session.os 
                    ? { browser: session.browser, os: session.os, deviceType: session.device_type || "Desktop" }
                    : parseUserAgent(session.user_agent);
                  
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{session.user_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{session.user_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon deviceType={session.device_type || parsed.deviceType} />
                          <span className="text-sm">{session.device_type || parsed.deviceType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{session.browser || parsed.browser}</TableCell>
                      <TableCell className="text-sm">{session.os || parsed.os}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {session.ip_address || "Not captured"}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(session.logged_in_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {session.is_active ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Expired</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
