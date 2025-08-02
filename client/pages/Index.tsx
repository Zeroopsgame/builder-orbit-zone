import { useState, useEffect } from "react";
import { Plus, Users, Clock, MapPin, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";

interface CrewMember {
  id: string;
  name: string;
  status: "in" | "out";
  note?: string;
  timestamp: Date;
}

export default function Index() {
  // UPDATE THIS URL TO MATCH YOUR CPANEL DOMAIN
  const API_BASE_URL = 'https://nerkco.com/roster/api';

  // Detect if we're in development mode
  const isDevelopment = window.location.hostname === 'localhost' ||
                       window.location.hostname.includes('fly.dev') ||
                       window.location.hostname.includes('builder.codes');

  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"crew" | "lead" | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [noteDialogMember, setNoteDialogMember] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Load crew members from API
  useEffect(() => {
    fetchCrewMembers();
  }, []);

  const fetchCrewMembers = async () => {
    // In development mode, use sample data directly
    if (isDevelopment) {
      console.log('Development mode detected - using sample data');
      setCrewMembers([
        {
          id: "1",
          name: "John Smith",
          status: "in",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          id: "2",
          name: "Sarah Johnson",
          status: "out",
          note: "Lunch",
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
        },
        {
          id: "3",
          name: "Mike Davis",
          status: "in",
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
        },
      ]);
      setLoading(false);
      return;
    }

    // In production mode, try to fetch from API
    try {
      const response = await fetch(`${API_BASE_URL}/crew.php`);
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map((member: any) => ({
          ...member,
          timestamp: new Date(member.timestamp)
        }));
        setCrewMembers(formattedData);
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.error('Failed to fetch crew members, using fallback data:', error);
      // Use fallback data when API is not available
      setCrewMembers([
        {
          id: "1",
          name: "John Smith",
          status: "in",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          id: "2",
          name: "Sarah Johnson",
          status: "out",
          note: "Lunch",
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
        },
        {
          id: "3",
          name: "Mike Davis",
          status: "in",
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addCrewMember = async () => {
    if (newMemberName.trim()) {
      // In development mode, use local state directly
      if (isDevelopment) {
        const newMember: CrewMember = {
          id: Date.now().toString(),
          name: newMemberName.trim(),
          status: "in",
          timestamp: new Date(),
        };
        setCrewMembers([...crewMembers, newMember]);
        setNewMemberName("");
        setShowAddDialog(false);
        return;
      }

      // In production mode, try API first
      try {
        const response = await fetch(`${API_BASE_URL}/crew.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newMemberName.trim() }),
        });

        if (response.ok) {
          const newMember = await response.json();
          newMember.timestamp = new Date(newMember.timestamp);
          setCrewMembers([...crewMembers, newMember]);
          setNewMemberName("");
          setShowAddDialog(false);
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        console.error('API not available, using local state:', error);
        // Fallback to local state when API is not available
        const newMember: CrewMember = {
          id: Date.now().toString(),
          name: newMemberName.trim(),
          status: "in",
          timestamp: new Date(),
        };
        setCrewMembers([...crewMembers, newMember]);
        setNewMemberName("");
        setShowAddDialog(false);
      }
    }
  };

  const removeMember = async (id: string) => {
    // Only flight leads can remove members
    if (userRole !== "lead") return;

    // In development mode, use local state directly
    if (isDevelopment) {
      setCrewMembers((members) => members.filter((member) => member.id !== id));
      return;
    }

    // In production mode, try API first
    try {
      const response = await fetch(`${API_BASE_URL}/crew.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setCrewMembers((members) => members.filter((member) => member.id !== id));
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.error('API not available, using local state:', error);
      // Fallback to local state
      setCrewMembers((members) => members.filter((member) => member.id !== id));
    }
  };

  const toggleStatus = async (id: string, checked: boolean) => {
    // Only allow toggle if user is flight lead or it's their own status
    const member = crewMembers.find((m) => m.id === id);
    if (userRole !== "lead" && member?.name !== currentUser) {
      return; // Not authorized
    }

    const newStatus = checked ? "in" : "out";

    if (newStatus === "out") {
      setNoteDialogMember(id);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/crew.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        setCrewMembers((members) =>
          members.map((member) =>
            member.id === id
              ? {
                  ...member,
                  status: newStatus,
                  note: undefined,
                  timestamp: new Date(),
                }
              : member,
          ),
        );
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.error('API not available, using local state:', error);
      // Fallback to local state
      setCrewMembers((members) =>
        members.map((member) =>
          member.id === id
            ? {
                ...member,
                status: newStatus,
                note: undefined,
                timestamp: new Date(),
              }
            : member,
        ),
      );
    }
  };

  const confirmStatusWithNote = async () => {
    if (noteDialogMember) {
      try {
        const response = await fetch(`${API_BASE_URL}/crew.php`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: noteDialogMember,
            status: "out",
            note: noteText
          }),
        });

        if (response.ok) {
          setCrewMembers((members) =>
            members.map((member) =>
              member.id === noteDialogMember
                ? {
                    ...member,
                    status: "out",
                    note: noteText,
                    timestamp: new Date(),
                  }
                : member,
            ),
          );
          setNoteDialogMember(null);
          setNoteText("");
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        console.error('API not available, using local state:', error);
        // Fallback to local state
        setCrewMembers((members) =>
          members.map((member) =>
            member.id === noteDialogMember
              ? {
                  ...member,
                  status: "out",
                  note: noteText,
                  timestamp: new Date(),
                }
              : member,
          ),
        );
        setNoteDialogMember(null);
        setNoteText("");
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusBadge = (status: "in" | "out") => {
    return status === "in" ? (
      <Badge className="bg-success text-success-foreground">IN</Badge>
    ) : (
      <Badge className="bg-destructive text-destructive-foreground">OUT</Badge>
    );
  };

  const inCount = crewMembers.filter((member) => member.status === "in").length;
  const outCount = crewMembers.filter(
    (member) => member.status === "out",
  ).length;

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading crew status...</p>
        </div>
      </div>
    );
  }

  // Show login screen if no user selected (unless flight lead)
  if ((!currentUser && userRole !== "lead") || !userRole) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex flex-col items-center space-y-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F1286fd005baa4e368e0e4e8dfaf9c2e8%2F3ddd57bd6dc845d9b67a66c8baf54949?format=webp&width=800"
                alt="U.S. Air Force"
                className="h-16 w-auto"
              />
              <CardTitle className="text-center">Access Crew Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setUserRole("lead");
                  setCurrentUser("Flight Lead");
                }}
                className="w-full"
                variant="default"
              >
                Flight Lead Access
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Full dashboard access
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Select Your Name:</p>
              <div className="space-y-2">
                {crewMembers.map((member) => (
                  <Button
                    key={member.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setCurrentUser(member.name);
                      setUserRole("crew");
                    }}
                  >
                    {member.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentUser(null);
              setUserRole(null);
            }}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center space-y-3">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F1286fd005baa4e368e0e4e8dfaf9c2e8%2F3ddd57bd6dc845d9b67a66c8baf54949?format=webp&width=800"
              alt="U.S. Air Force"
              className="h-20 w-auto"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Crew Status
              </h1>
              <p className="text-muted-foreground">
                Real-time crew location tracking
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <Badge variant="outline">
              {userRole === "lead"
                ? "Flight Lead"
                : `Logged in as: ${currentUser}`}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentUser(null);
                setUserRole(null);
              }}
            >
              Switch User
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{crewMembers.length}</p>
                <p className="text-sm text-muted-foreground">Total Crew</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="h-8 w-8 bg-success rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-success-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{inCount}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="h-8 w-8 bg-destructive rounded-full flex items-center justify-center">
                <MapPin className="h-4 w-4 text-destructive-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">
                  {outCount}
                </p>
                <p className="text-sm text-muted-foreground">Away</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Member */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {userRole === "lead" ? "Crew Members" : "Your Status"}
              </span>
              {userRole === "lead" && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Crew Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter crew member name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addCrewMember()}
                      />
                      <Button onClick={addCrewMember} className="w-full">
                        Add Member
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {crewMembers
              .filter(
                (member) => userRole === "lead" || member.name === currentUser,
              )
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="space-y-1">
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(member.timestamp)}</span>
                        {member.note && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{member.note}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {getStatusBadge(member.status)}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Out</span>
                      <Switch
                        checked={member.status === "in"}
                        onCheckedChange={(checked) =>
                          toggleStatus(member.id, checked)
                        }
                        className="data-[state=checked]:bg-success data-[state=unchecked]:bg-destructive"
                      />
                      <span className="text-sm text-muted-foreground">In</span>
                    </div>
                    {userRole === "lead" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Note Dialog */}
        <Dialog
          open={!!noteDialogMember}
          onOpenChange={() => setNoteDialogMember(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Where are you going?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="e.g., Pre-flight inspection, Lunch break, Training..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="flex space-x-2">
                <Button onClick={confirmStatusWithNote} className="flex-1">
                  Mark Out
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNoteDialogMember(null);
                    setNoteText("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
