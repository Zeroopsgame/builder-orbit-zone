import { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Clock,
  MapPin,
  Trash2,
  ArrowLeft,
  User,
} from "lucide-react";
import { getStore } from "@netlify/blobs";
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
  const API_BASE_URL = "https://nerkco.com/roster/api";

  // Detect if we're in development mode
  const isDevelopment =
    window.location.hostname === "localhost" ||
    window.location.hostname.includes("fly.dev") ||
    window.location.hostname.includes("builder.codes");

  // Initialize Netlify Blobs storage for multi-user persistence
  const getCrewStore = () => {
    try {
      return getStore("crew-status");
    } catch (error) {
      console.log("Netlify Blobs not available, using local storage fallback");
      return null;
    }
  };

  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"crew" | "lead" | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [noteDialogMember, setNoteDialogMember] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState("");

  // Load crew members from API
  useEffect(() => {
    fetchCrewMembers();
  }, []);

  // Helper function to save crew data with multi-device sync
  const saveCrewMembers = async (members: CrewMember[]) => {
    try {
      const store = getCrewStore();
      if (store) {
        await store.setJSON("crew-members", members);
        console.log("✅ Crew data saved to Netlify Blobs successfully");
        return;
      }
    } catch (error) {
      console.log("Netlify Blobs not available, trying API fallback");
    }

    // Fallback to API-based shared storage for multi-device sync
    try {
      const response = await fetch(`${API_BASE_URL}/crew.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save_all",
          crew_members: members,
        }),
      });

      if (response.ok) {
        console.log("✅ Crew data saved to shared API storage");
        return;
      } else {
        throw new Error("API save failed");
      }
    } catch (apiError) {
      console.log("⚠️ API not available, using localStorage (device-only)");
      // Final fallback to localStorage (device-specific)
      try {
        localStorage.setItem("crew-members-fallback", JSON.stringify(members));
        console.log("💾 Saved to localStorage (device-only) as final fallback");
      } catch (localError) {
        console.error("❌ Could not save anywhere:", localError);
      }
    }
  };

  const fetchCrewMembers = async () => {
    let hasSharedData = false;

    // Always try shared storage first (Netlify Blobs or API)
    try {
      const store = getCrewStore();
      if (store) {
        // Try to load from Netlify Blobs first
        const storedData = await store.get("crew-members", { type: "json" });
        if (storedData && storedData.length > 0) {
          const formattedData = storedData.map((member: any) => ({
            ...member,
            timestamp: new Date(member.timestamp),
          }));
          setCrewMembers(formattedData);
          console.log("✅ Loaded crew data from Netlify Blobs - clearing old localStorage");
          // Clear old localStorage since we have shared data
          localStorage.removeItem("crew-members-fallback");
          hasSharedData = true;
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log("Netlify Blobs not available, trying API");
    }

    // Try API-based shared storage for multi-device sync
    try {
      console.log("🔄 Attempting to fetch from API:", `${API_BASE_URL}/crew.php?action=get_all`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/crew.php?action=get_all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const apiData = await response.json();
        if (apiData && apiData.length > 0) {
          const formattedData = apiData.map((member: any) => ({
            ...member,
            timestamp: new Date(member.timestamp),
          }));
          setCrewMembers(formattedData);
          console.log("✅ Loaded crew data from shared API storage - clearing old localStorage");
          // Clear old localStorage since we have shared data
          localStorage.removeItem("crew-members-fallback");
          hasSharedData = true;
          setLoading(false);
          return;
        } else {
          console.log("⚠️ API returned empty data");
        }
      } else {
        console.log("⚠️ API returned error status:", response.status, response.statusText);
      }
    } catch (apiError) {
      if (apiError.name === 'AbortError') {
        console.log("⚠️ API request timed out after 5 seconds");
      } else {
        console.log("❌ API failed:", apiError.message || apiError);
      }
    }

    // Only use localStorage if NO shared storage is available
    if (!hasSharedData) {
      try {
        const fallbackData = localStorage.getItem("crew-members-fallback");
        if (fallbackData) {
          const parsedData = JSON.parse(fallbackData);
          const formattedData = parsedData.map((member: any) => ({
            ...member,
            timestamp: new Date(member.timestamp),
          }));
          setCrewMembers(formattedData);
          console.log("⚠️ Using localStorage (device-only) - shared storage unavailable");
          setLoading(false);
          return;
        }
      } catch (localError) {
        console.log("❌ localStorage failed, using sample data");
      }
    }

    // Fallback to sample data if no stored data exists
    const sampleData = [
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
    ];

    setCrewMembers(sampleData);

    // Save sample data to Netlify Blobs for future use
    try {
      const store = getCrewStore();
      if (store) {
        await store.setJSON("crew-members", sampleData);
      }
    } catch (error) {
      console.log("Could not save to Netlify Blobs");
    }

    setLoading(false);
  };

  const addCrewMember = async () => {
    if (newMemberName.trim()) {
      const newMember: CrewMember = {
        id: Date.now().toString(),
        name: newMemberName.trim(),
        status: "in",
        timestamp: new Date(),
      };

      const updatedMembers = [...crewMembers, newMember];
      setCrewMembers(updatedMembers);

      // Save to Netlify Blobs for multi-user persistence
      await saveCrewMembers(updatedMembers);

      setNewMemberName("");
      setShowAddDialog(false);
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
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setCrewMembers((members) =>
          members.filter((member) => member.id !== id),
        );
      } else {
        throw new Error("API not available");
      }
    } catch (error) {
      console.log("Development mode: using local state (API not available)");
      // Fallback to local state
      const updatedMembers = crewMembers.filter((member) => member.id !== id);
      setCrewMembers(updatedMembers);

      // Save to Netlify Blobs for multi-user persistence
      await saveCrewMembers(updatedMembers);
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

    const updatedMembers = crewMembers.map((member) =>
      member.id === id
        ? {
            ...member,
            status: newStatus,
            note: undefined,
            timestamp: new Date(),
          }
        : member,
    );

    setCrewMembers(updatedMembers);

    // Save to Netlify Blobs for multi-user persistence
    await saveCrewMembers(updatedMembers);
  };

  const confirmStatusWithNote = async () => {
    if (noteDialogMember) {
      try {
        const response = await fetch(`${API_BASE_URL}/crew.php`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: noteDialogMember,
            status: "out",
            note: noteText,
          }),
        });

        const updatedMembers = crewMembers.map((member) =>
          member.id === noteDialogMember
            ? {
                ...member,
                status: "out",
                note: noteText,
                timestamp: new Date(),
              }
            : member,
        );

        setCrewMembers(updatedMembers);

        // Save to Netlify Blobs for multi-user persistence
        await saveCrewMembers(updatedMembers);

        setNoteDialogMember(null);
        setNoteText("");
      } catch (error) {
        console.log("Error updating status:", error);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;

    if (hours < 24) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const handleFlightLeadLogin = () => {
    if (passwordInput === "15") {
      setUserRole("lead");
      setCurrentUser("Flight Lead");
      setShowPasswordDialog(false);
      setPasswordInput("");
    } else {
      alert("Incorrect password. Please try again.");
      setPasswordInput("");
    }
  };

  const updateMemberName = async (id: string, newName: string) => {
    if (!newName.trim()) return;

    const updatedMembers = crewMembers.map((member) =>
      member.id === id ? { ...member, name: newName.trim() } : member,
    );

    setCrewMembers(updatedMembers);

    // Save to Netlify Blobs for multi-user persistence
    await saveCrewMembers(updatedMembers);

    setEditingMemberId(null);
    setEditNameInput("");
  };

  const startEditingName = (member: CrewMember) => {
    setEditingMemberId(member.id);
    setEditNameInput(member.name);
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
      <div className="h-screen bg-white flex flex-col">
        {/* Top Section - Air Force Branding */}
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-700 py-8 md:py-12">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative z-10 flex flex-col justify-center items-center text-white px-4">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F1286fd005baa4e368e0e4e8dfaf9c2e8%2Fada268c851184cf1830e50c8656ea528?format=webp&width=800"
              alt="Air Force Logo"
              className="w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6"
            />
            <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">
              WELCOME BACK
            </h1>
            <p className="text-lg md:text-xl text-slate-300">U.S. AIR FORCE</p>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">Loading crew status...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if no user selected (unless flight lead)
  if ((!currentUser && userRole !== "lead") || !userRole) {
    const presentCount = crewMembers.filter(
      (member) => member.status === "in",
    ).length;
    const totalCount = crewMembers.length;
    const presentPercentage =
      totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    const getStatusMessage = () => {
      if (presentPercentage === 100) return "✨ Kawaii! All present! ✨";
      if (presentPercentage >= 80) return "🌟 Almost everyone's here!";
      if (presentPercentage >= 60) return "👥 Most crew present";
      if (presentPercentage >= 40) return "⚠️ Some crew away";
      return "🚨 Many crew members out";
    };

    const getStatusColor = () => {
      if (presentPercentage === 100) return "from-green-400 to-green-600";
      if (presentPercentage >= 80) return "from-green-300 to-green-500";
      if (presentPercentage >= 60) return "from-yellow-300 to-yellow-500";
      if (presentPercentage >= 40) return "from-orange-300 to-orange-500";
      return "from-red-300 to-red-500";
    };
    return (
      <div className="h-screen bg-white flex flex-col">
        {/* Top Blue Banner */}
        <div className="bg-blue-900 h-3 w-full flex-shrink-0"></div>

        {/* Middle Section - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-6 md:space-y-8">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-medium text-gray-600 mb-2">
                OTS FLIGHT 15
              </h2>
              <h3 className="text-lg md:text-xl font-medium text-gray-500 mb-6 md:mb-8">
                STATUS LIVE TRACKER
              </h3>
              <p className="text-sm text-gray-500 mb-6 md:mb-8">
                Select your access level to begin
              </p>
            </div>

            {/* Status Overview */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  {getStatusMessage()}
                </span>
                <span className="text-sm text-gray-500">
                  {presentPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${getStatusColor()} transition-all duration-300`}
                  style={{ width: `${presentPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Flight Lead Button */}
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Flight Lead button clicked");
                setShowPasswordDialog(true);
              }}
              className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium text-base"
              variant="default"
            >
              Flight Lead Access
            </Button>

            {/* Crew Member Selection */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-600 text-center">
                Or select your name:
              </p>
              <div className="space-y-2">
                {crewMembers
                  .sort((a, b) => {
                    // Sort by first name (the part after "OT ")
                    const firstNameA = a.name.split(" ")[0].toLowerCase();
                    const firstNameB = b.name.split(" ")[0].toLowerCase();
                    return firstNameA.localeCompare(firstNameB);
                  })
                  .map((member) => (
                    <Button
                      key={member.id}
                      variant="outline"
                      className="w-full justify-between px-4 py-3 h-auto border-gray-200 hover:bg-gray-50 text-left"
                      onClick={() => {
                        setCurrentUser(member.name);
                        setUserRole("crew");
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-700">
                          OT {member.name}
                        </span>
                      </div>
                      <div className="text-right text-xs">
                        {member.status === "out" ? (
                          <span className="px-2 py-1 rounded-full font-medium bg-red-100 text-red-700">
                            OUT @ {formatTime(member.timestamp)}
                            {member.note && ` • ${member.note}`}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                            IN
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
              </div>
            </div>

            {/* Bottom Blue Banner */}
            <div className="bg-blue-900 h-3 w-full flex-shrink-0"></div>
          </div>
        </div>

        {/* Password Dialog - Available on login screen */}
        <Dialog
          open={showPasswordDialog}
          onOpenChange={(open) => {
            console.log("Password dialog state changing to:", open);
            setShowPasswordDialog(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Flight Lead Authentication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the flight lead password to access the dashboard:
              </p>
              <Input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleFlightLeadLogin()}
              />
              <div className="flex space-x-2">
                <Button onClick={handleFlightLeadLogin} className="flex-1">
                  Access Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPasswordInput("");
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
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
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
        <div className="text-center space-y-4 p-6">
          <div className="flex flex-col items-center space-y-3">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F1286fd005baa4e368e0e4e8dfaf9c2e8%2Fada268c851184cf1830e50c8656ea528?format=webp&width=800"
              alt="Air Force Logo"
              className="w-12 h-12 mb-2"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                U.S. AIR FORCE
              </h1>
              <h2 className="text-lg font-semibold text-gray-700">
                OTS FLIGHT 15
              </h2>
              <p className="text-sm text-gray-600 mt-1">STATUS LIVE TRACKER</p>
              <p className="text-xs text-gray-500 mt-2">
                Real-time crew location tracking
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <Badge variant="outline">
              {userRole === "lead"
                ? "Flight Lead"
                : `Logged in as: OT ${currentUser}`}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">
                  {crewMembers.length}
                </p>
                <p className="text-sm font-medium text-blue-700">Total Crew</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{inCount}</p>
                <p className="text-sm font-medium text-green-700">Present</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="h-12 w-12 bg-red-500 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{outCount}</p>
                <p className="text-sm font-medium text-red-700">Away</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Crew Management */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
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
              .sort((a, b) => {
                // Sort by first name (the part after "OT ")
                const firstNameA = a.name.split(" ")[0].toLowerCase();
                const firstNameB = b.name.split(" ")[0].toLowerCase();
                return firstNameA.localeCompare(firstNameB);
              })
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-6 border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="space-y-1">
                      {userRole === "lead" && editingMemberId === member.id ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">OT</span>
                          <Input
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                updateMemberName(member.id, editNameInput);
                              } else if (e.key === "Escape") {
                                setEditingMemberId(null);
                                setEditNameInput("");
                              }
                            }}
                            onBlur={() =>
                              updateMemberName(member.id, editNameInput)
                            }
                            className="font-medium h-6 w-32"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p
                            className={`font-medium text-lg ${userRole === "lead" ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
                            onClick={() =>
                              userRole === "lead" && startEditingName(member)
                            }
                            title={
                              userRole === "lead" ? "Click to edit name" : ""
                            }
                          >
                            OT {member.name}
                          </p>
                          <p
                            className={`text-sm font-medium ${
                              member.status === "out"
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {member.status === "out"
                              ? `out at ${formatTime(member.timestamp)} ${member.note ? `at ${member.note}` : ""}`
                              : "present"}
                          </p>
                        </div>
                      )}
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
