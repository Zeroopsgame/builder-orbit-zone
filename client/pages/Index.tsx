import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Settings, UserPlus, Trash2, Edit, Check, X } from "lucide-react";

interface CrewMember {
  id: string;
  name: string;
  isIn: boolean;
  lastUpdate: string;
  location: string;
  notes: string;
}

export default function Index() {
  // API functions for Netlify Function
  const fetchCrewMembers = async (): Promise<CrewMember[]> => {
    try {
      console.log("🔄 Fetching crew data from Netlify Function...");
      const response = await fetch('/.netlify/functions/crew-data-simple', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Successfully fetched crew data:", data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Failed to fetch crew data:", error);
      // Return sample data if fetch fails
      return [
        {
          id: "1",
          name: "OT Sample User",
          isIn: true,
          lastUpdate: new Date().toISOString(),
          location: "",
          notes: ""
        }
      ];
    }
  };

  const saveCrewMembers = async (members: CrewMember[]): Promise<boolean> => {
    try {
      console.log("💾 Saving crew data to Netlify Function...", members);
      const response = await fetch('/.netlify/functions/crew-data-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crewMembers: members }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("✅ Successfully saved crew data:", result);
      return result.success === true;
    } catch (error) {
      console.error("❌ Failed to save crew data:", error);
      return false;
    }
  };

  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"crew" | "lead" | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [statusNotes, setStatusNotes] = useState("");
  const [statusLocation, setStatusLocation] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatusMember, setPendingStatusMember] = useState<string | null>(null);

  // Load crew members on component mount
  useEffect(() => {
    const loadCrewMembers = async () => {
      setLoading(true);
      const members = await fetchCrewMembers();
      // Sort by first name after "OT"
      const sortedMembers = members.sort((a, b) => {
        const nameA = a.name.replace(/^OT\s*/, "").trim();
        const nameB = b.name.replace(/^OT\s*/, "").trim();
        return nameA.localeCompare(nameB);
      });
      setCrewMembers(sortedMembers);
      setLoading(false);
    };
    
    loadCrewMembers();
  }, []);

  // Auto-save when crewMembers changes (debounced)
  useEffect(() => {
    if (crewMembers.length > 0 && !loading) {
      const timeoutId = setTimeout(() => {
        saveCrewMembers(crewMembers);
      }, 1000); // Save after 1 second of no changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [crewMembers, loading]);

  const handlePasswordSubmit = () => {
    if (password === "15") {
      setUserRole("lead");
      setShowPasswordDialog(false);
      setPassword("");
    } else {
      alert("Incorrect password");
      setPassword("");
    }
  };

  const addCrewMember = async () => {
    if (newMemberName.trim()) {
      const name = newMemberName.startsWith("OT ") 
        ? newMemberName 
        : `OT ${newMemberName}`;
      
      const newMember: CrewMember = {
        id: Date.now().toString(),
        name: name,
        isIn: true,
        lastUpdate: new Date().toISOString(),
        location: "",
        notes: "",
      };
      
      const updatedMembers = [...crewMembers, newMember].sort((a, b) => {
        const nameA = a.name.replace(/^OT\s*/, "").trim();
        const nameB = b.name.replace(/^OT\s*/, "").trim();
        return nameA.localeCompare(nameB);
      });
      
      setCrewMembers(updatedMembers);
      setNewMemberName("");
      
      // Save immediately for new members
      await saveCrewMembers(updatedMembers);
    }
  };

  const removeMember = async (id: string) => {
    const updatedMembers = crewMembers.filter(member => member.id !== id);
    setCrewMembers(updatedMembers);
    await saveCrewMembers(updatedMembers);
  };

  const startEditingName = (member: CrewMember) => {
    setEditingMemberId(member.id);
    setEditingName(member.name);
  };

  const saveEditingName = async () => {
    if (editingMemberId && editingName.trim()) {
      const name = editingName.startsWith("OT ") 
        ? editingName 
        : `OT ${editingName}`;
        
      const updatedMembers = crewMembers.map(member =>
        member.id === editingMemberId
          ? { ...member, name: name }
          : member
      ).sort((a, b) => {
        const nameA = a.name.replace(/^OT\s*/, "").trim();
        const nameB = b.name.replace(/^OT\s*/, "").trim();
        return nameA.localeCompare(nameB);
      });
      
      setCrewMembers(updatedMembers);
      setEditingMemberId(null);
      setEditingName("");
      await saveCrewMembers(updatedMembers);
    }
  };

  const cancelEditingName = () => {
    setEditingMemberId(null);
    setEditingName("");
  };

  const handleStatusToggle = (memberId: string, currentStatus: boolean) => {
    if (!currentStatus) {
      // Going from Out to In - no dialog needed
      updateMemberStatus(memberId, true, "", "");
    } else {
      // Going from In to Out - need location/notes
      setPendingStatusMember(memberId);
      setStatusNotes("");
      setStatusLocation("");
      setShowStatusDialog(true);
    }
  };

  const updateMemberStatus = async (
    memberId: string,
    isIn: boolean,
    location: string = "",
    notes: string = ""
  ) => {
    const updatedMembers = crewMembers.map(member =>
      member.id === memberId
        ? {
            ...member,
            isIn,
            location,
            notes,
            lastUpdate: new Date().toISOString(),
          }
        : member
    );
    setCrewMembers(updatedMembers);
    await saveCrewMembers(updatedMembers);
  };

  const handleStatusDialogSubmit = () => {
    if (pendingStatusMember && statusLocation.trim()) {
      updateMemberStatus(pendingStatusMember, false, statusLocation, statusNotes);
      setShowStatusDialog(false);
      setPendingStatusMember(null);
      setStatusNotes("");
      setStatusLocation("");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusDisplay = (member: CrewMember) => {
    const time = formatTime(member.lastUpdate);
    if (member.isIn) {
      return `In • ${time}`;
    } else {
      return `Out • ${member.location} • ${time}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading crew status...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="flex flex-col items-center space-y-4">
              <img
                src="https://builder.io/api/v1/image/assets%2F79cc5a94c2b54dff8b956b850b45e84f%2Facc6ea8dacea44a4b45a09b33c5f36c3"
                alt="Air Force Logo"
                className="w-20 h-20 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-blue-700">
                  WELCOME BACK US AIR FORCE
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  STATUS LIVE TRACKER
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {crewMembers.filter((m) => m.isIn).length}
                    </p>
                    <p className="text-sm font-medium text-green-700">In</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {crewMembers.filter((m) => !m.isIn).length}
                    </p>
                    <p className="text-sm font-medium text-red-700">Out</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {crewMembers.length}
                    </p>
                    <p className="text-sm font-medium text-blue-700">
                      Total Crew
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="user-select">Select Your Name:</Label>
              <select
                id="user-select"
                className="w-full p-2 border border-gray-300 rounded-md"
                onChange={(e) => {
                  setCurrentUser(e.target.value);
                  setUserRole("crew");
                }}
                value=""
              >
                <option value="">Choose your name...</option>
                {crewMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>

              <Dialog
                open={showPasswordDialog}
                onOpenChange={setShowPasswordDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Flight Lead Access
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Flight Lead Access</DialogTitle>
                    <DialogDescription>
                      Enter the flight lead password to manage crew members.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handlePasswordSubmit()
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handlePasswordSubmit}>Access</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-6">
          <div className="flex flex-col items-center space-y-4">
            <img
              src="https://builder.io/api/v1/image/assets%2F79cc5a94c2b54dff8b956b850b45e84f%2Facc6ea8dacea44a4b45a09b33c5f36c3"
              alt="Air Force Logo"
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-blue-700">
                WELCOME BACK US AIR FORCE
              </h1>
              <p className="text-sm text-gray-600 mt-1">STATUS LIVE TRACKER</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">OTS FLIGHT 15 - Status Dashboard</CardTitle>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Logged in as: <span className="font-medium">{currentUser}</span> ({userRole})
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentUser(null);
                    setUserRole(null);
                  }}
                >
                  Switch User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {crewMembers.filter((m) => m.isIn).length}
                    </p>
                    <p className="text-sm font-medium text-green-700">In</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {crewMembers.filter((m) => !m.isIn).length}
                    </p>
                    <p className="text-sm font-medium text-red-700">Out</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {crewMembers.length}
                    </p>
                    <p className="text-sm font-medium text-blue-700">Total Crew</p>
                  </div>
                </div>
              </div>

              {userRole === "lead" && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-3">Flight Lead Controls</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter crew member name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && addCrewMember()
                      }
                    />
                    <Button onClick={addCrewMember} className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {crewMembers
                  .filter(
                    (member) =>
                      userRole === "lead" || member.name === currentUser,
                  )
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          {userRole === "lead" &&
                          editingMemberId === member.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="w-40"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") saveEditingName();
                                  if (e.key === "Escape") cancelEditingName();
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={saveEditingName}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditingName}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {member.name}
                              </h3>
                              {userRole === "lead" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditingName(member)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={member.isIn ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {getStatusDisplay(member)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            Out
                          </span>
                          <Switch
                            checked={member.isIn}
                            onCheckedChange={() =>
                              handleStatusToggle(member.id, member.isIn)
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            In
                          </span>
                        </div>

                        {userRole === "lead" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Going Out</DialogTitle>
              <DialogDescription>
                Please provide your location and any additional notes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={statusLocation}
                  onChange={(e) => setStatusLocation(e.target.value)}
                  placeholder="Where are you going?"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusDialogSubmit}
                disabled={!statusLocation.trim()}
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="text-center mt-8 text-xs text-gray-500">
          Copyright 2025 OT Moser
        </div>
      </div>
    </div>
  );
}
