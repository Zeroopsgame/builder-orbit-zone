import { useState } from 'react';
import { Plus, Users, Clock, MapPin, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';

interface CrewMember {
  id: string;
  name: string;
  status: 'in' | 'out';
  note?: string;
  timestamp: Date;
}

export default function Index() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([
    {
      id: '1',
      name: 'John Smith',
      status: 'in',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      status: 'out',
      note: 'Pre-flight inspection',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    },
    {
      id: '3',
      name: 'Mike Davis',
      status: 'in',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    },
  ]);

  const [newMemberName, setNewMemberName] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [noteDialogMember, setNoteDialogMember] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const addCrewMember = () => {
    if (newMemberName.trim()) {
      const newMember: CrewMember = {
        id: Date.now().toString(),
        name: newMemberName.trim(),
        status: 'in',
        timestamp: new Date(),
      };
      setCrewMembers([...crewMembers, newMember]);
      setNewMemberName('');
      setShowAddDialog(false);
    }
  };

  const removeMember = (id: string) => {
    setCrewMembers(members => members.filter(member => member.id !== id));
  };

  const toggleStatus = (id: string, newStatus: 'in' | 'out') => {
    if (newStatus === 'out') {
      setNoteDialogMember(id);
      return;
    }
    
    setCrewMembers(members =>
      members.map(member =>
        member.id === id
          ? { ...member, status: newStatus, note: undefined, timestamp: new Date() }
          : member
      )
    );
  };

  const confirmStatusWithNote = () => {
    if (noteDialogMember) {
      setCrewMembers(members =>
        members.map(member =>
          member.id === noteDialogMember
            ? { ...member, status: 'out', note: noteText, timestamp: new Date() }
            : member
        )
      );
      setNoteDialogMember(null);
      setNoteText('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: 'in' | 'out') => {
    return status === 'in' ? (
      <Badge className="bg-success text-success-foreground">IN</Badge>
    ) : (
      <Badge className="bg-destructive text-destructive-foreground">OUT</Badge>
    );
  };

  const inCount = crewMembers.filter(member => member.status === 'in').length;
  const outCount = crewMembers.filter(member => member.status === 'out').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Crew Status</h1>
          <p className="text-muted-foreground">Real-time crew location tracking</p>
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
                <p className="text-2xl font-bold text-destructive">{outCount}</p>
                <p className="text-sm text-muted-foreground">Away</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Member */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Crew Members</span>
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
                      onKeyPress={(e) => e.key === 'Enter' && addCrewMember()}
                    />
                    <Button onClick={addCrewMember} className="w-full">
                      Add Member
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {crewMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(member.status)}
                  <Button
                    variant={member.status === 'in' ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => toggleStatus(member.id, member.status === 'in' ? 'out' : 'in')}
                    className={member.status === 'out' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}
                  >
                    {member.status === 'in' ? 'Mark Out' : 'Mark In'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Note Dialog */}
        <Dialog open={!!noteDialogMember} onOpenChange={() => setNoteDialogMember(null)}>
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
                    setNoteText('');
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
