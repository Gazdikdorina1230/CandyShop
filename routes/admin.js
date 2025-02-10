router.put('/users/:id/role', authenticateToken, adminOnly, async (req, res) => {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }
    try {
      await admin.auth().setCustomUserClaims(req.params.id, { role });
      res.status(200).json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });  