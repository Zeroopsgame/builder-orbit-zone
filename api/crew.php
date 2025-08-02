<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

switch ($method) {
    case 'GET':
        // Get all crew members
        try {
            $stmt = $pdo->query("SELECT id, name, status, note, updated_at as timestamp FROM crew_members ORDER BY name");
            $crew = $stmt->fetchAll();
            
            // Convert timestamp to JavaScript format
            foreach ($crew as &$member) {
                $member['timestamp'] = date('c', strtotime($member['timestamp']));
            }
            
            echo json_encode($crew);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch crew members']);
        }
        break;

    case 'POST':
        // Add new crew member
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || empty(trim($input['name']))) {
            http_response_code(400);
            echo json_encode(['error' => 'Name is required']);
            break;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO crew_members (name, status) VALUES (?, 'in')");
            $stmt->execute([trim($input['name'])]);
            
            $id = $pdo->lastInsertId();
            echo json_encode([
                'id' => $id,
                'name' => trim($input['name']),
                'status' => 'in',
                'note' => null,
                'timestamp' => date('c')
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add crew member']);
        }
        break;

    case 'PUT':
        // Update crew member status
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id']) || !isset($input['status'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID and status are required']);
            break;
        }

        try {
            if ($input['status'] === 'out' && isset($input['note'])) {
                $stmt = $pdo->prepare("UPDATE crew_members SET status = ?, note = ? WHERE id = ?");
                $stmt->execute([$input['status'], $input['note'], $input['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE crew_members SET status = ?, note = NULL WHERE id = ?");
                $stmt->execute([$input['status'], $input['id']]);
            }
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update crew member']);
        }
        break;

    case 'DELETE':
        // Delete crew member
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            break;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM crew_members WHERE id = ?");
            $stmt->execute([$input['id']]);
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete crew member']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
