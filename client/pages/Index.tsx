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
  // Environment detection
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com'));
  
  // API functions with environment detection
  const fetchCrewMembers = async (): Promise<CrewMember[]> => {
    if (isNetlify) {
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
        return getSampleData();
      }
    } else {
      console.log("🔄 Local dev environment - using localStorage fallback");
      const stored = localStorage.getItem('crew-members');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return getSampleData();
        }
      }
      return getSampleData();
    }
  };

  const saveCrewMembers = async (members: CrewMember[]): Promise<boolean> => {
    if (isNetlify) {
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
    } else {
      console.log("💾 Local dev environment - saving to localStorage");
      try {
        localStorage.setItem('crew-members', JSON.stringify(members));
        console.log("✅ Successfully saved crew data to localStorage");
        return true;
      } catch (error) {
        console.error("❌ Failed to save to localStorage:", error);
        return false;
      }
    }
  };

  const getSampleData = (): CrewMember[] => [
    {
      id: "1",
      name: "OT Sample User",
      isIn: true,
      lastUpdate: new Date().toISOString(),
      location: "",
      notes: ""
    }
  ];

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading crew status...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-8">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F1286fd005baa4e368e0e4e8dfaf9c2e8%2F962aeba48dbd4536b2fe3a0a4e31965f?format=webp&width=800"
                    alt="Air Force Logo"
                    className="relative w-24 h-24 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    OTS FLIGHT 15
                  </h1>
                  <p className="text-blue-200 font-medium text-lg">
                    STATUS TRACKER
                  </p>
                </div>
              </div>
            </div>
            
            {/* Status Summary */}
            <div className="mb-8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-7 h-7 bg-green-400 rounded-full"></div>
                    </div>
                    <p className="text-4xl font-bold text-green-400">
                      {crewMembers.filter((m) => m.isIn).length}
                    </p>
                    <p className="text-green-200 font-medium">IN</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-7 h-7 bg-red-400 rounded-full"></div>
                    </div>
                    <p className="text-4xl font-bold text-red-400">
                      {crewMembers.filter((m) => !m.isIn).length}
                    </p>
                    <p className="text-red-200 font-medium">OUT</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-7 h-7 bg-blue-400 rounded-full"></div>
                    </div>
                    <p className="text-4xl font-bold text-blue-400">
                      {crewMembers.length}
                    </p>
                    <p className="text-blue-200 font-medium">TOTAL</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Crew Status List */}
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-xl text-center">Select Your Name</h3>
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                {crewMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                    onClick={() => {
                      setCurrentUser(member.name);
                      setUserRole("crew");
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${member.isIn ? 'bg-green-400' : 'bg-red-400'} shadow-lg`}></div>
                        <span className="text-white font-medium text-lg">{member.name}</span>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          member.isIn 
                            ? 'bg-green-400/20 text-green-300 border border-green-400/30' 
                            : 'bg-red-400/20 text-red-300 border border-red-400/30'
                        }`}>
                          {member.isIn ? 'IN' : 'OUT'}
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                          {formatTime(member.lastUpdate)}
                        </div>
                        {!member.isIn && member.location && (
                          <div className="text-gray-400 text-sm">
                            📍 {member.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Flight Lead Access */}
              <div className="pt-6 border-t border-white/20">
                <Dialog
                  open={showPasswordDialog}
                  onOpenChange={setShowPasswordDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-none shadow-lg text-lg py-6"
                    >
                      <Settings className="h-6 w-6 mr-3" />
                      Flight Lead Access
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-gray-600">
                    <DialogHeader>
                      <DialogTitle className="text-white">Flight Lead Access</DialogTitle>
                      <DialogDescription className="text-gray-300">
                        Enter the flight lead password to manage crew members.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="password" className="text-white">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handlePasswordSubmit()
                          }
                          className="bg-slate-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handlePasswordSubmit} className="bg-blue-600 hover:bg-blue-700">
                        Access
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center space-y-6">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F1286fd005baa4e368e0e4e8dfaf9c2e8%2F962aeba48dbd4536b2fe3a0a4e31965f?format=webp&width=800"
              alt="Air Force Logo"
              className="w-20 h-20 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold text-white">
                OTS FLIGHT 15
              </h1>
              <p className="text-blue-200 font-medium text-lg">STATUS TRACKER</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
            <CardHeader className="pb-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl text-white">Flight Dashboard</CardTitle>
                <div className="flex items-center space-x-4">
                  <span className="text-blue-200">
                    Logged in as: <span className="font-medium text-white">{currentUser}</span> ({userRole})
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentUser(null);
                      setUserRole(null);
                    }}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Switch User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-white">
              {/* Status Summary */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-6 h-6 bg-green-400 rounded-full"></div>
                    </div>
                    <p className="text-3xl font-bold text-green-400">
                      {crewMembers.filter((m) => m.isIn).length}
                    </p>
                    <p className="text-green-200 font-medium">IN</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-6 h-6 bg-red-400 rounded-full"></div>
                    </div>
                    <p className="text-3xl font-bold text-red-400">
                      {crewMembers.filter((m) => !m.isIn).length}
                    </p>
                    <p className="text-red-200 font-medium">OUT</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                    </div>
                    <p className="text-3xl font-bold text-blue-400">
                      {crewMembers.length}
                    </p>
                    <p className="text-blue-200 font-medium">TOTAL</p>
                  </div>
                </div>
              </div>

              {userRole === "lead" && (
                <div className="mb-8 p-6 bg-yellow-500/10 rounded-xl border border-yellow-400/30">
                  <h3 className="font-semibold text-yellow-300 mb-4 text-lg">Flight Lead Controls</h3>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter crew member name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && addCrewMember()
                      }
                      className="bg-white/10 border-white/20 text-white placeholder-gray-300"
                    />
                    <Button onClick={addCrewMember} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {crewMembers
                  .filter(
                    (member) =>
                      userRole === "lead" || member.name === currentUser,
                  )
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          {userRole === "lead" &&
                          editingMemberId === member.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="w-48 bg-white/10 border-white/20 text-white"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") saveEditingName();
                                  if (e.key === "Escape") cancelEditingName();
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={saveEditingName}
                                className="text-green-400 hover:text-green-300"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditingName}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-white text-lg">
                                {member.name}
                              </h3>
                              {userRole === "lead" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditingName(member)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={member.isIn ? "default" : "destructive"}
                              className="text-sm"
                            >
                              {getStatusDisplay(member)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-red-300 font-medium">OUT</span>
                          <Switch
                            checked={member.isIn}
                            onCheckedChange={() =>
                              handleStatusToggle(member.id, member.isIn)
                            }
                          />
                          <span className="text-green-300 font-medium">IN</span>
                        </div>

                        {userRole === "lead" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent className="bg-slate-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">Going Out</DialogTitle>
              <DialogDescription className="text-gray-300">
                Please provide your location and any additional notes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location" className="text-white">Location *</Label>
                <Input
                  id="location"
                  value={statusLocation}
                  onChange={(e) => setStatusLocation(e.target.value)}
                  placeholder="Where are you going?"
                  className="bg-slate-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="notes" className="text-white">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={3}
                  className="bg-slate-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusDialogSubmit}
                disabled={!statusLocation.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center mt-12 text-blue-200/60">
          Copyright 2025 OT Moser
        </div>
      </div>
    </div>
  );
}
