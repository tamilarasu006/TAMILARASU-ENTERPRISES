const prisma = require('../prisma');
const errorResponse = require('../utils/errorResponse');

const getAuditLogs = async (req, res) => {
  try {
    const { action, resourceType, actorId, page = 1, limit = 50 } = req.query;

    const where = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (actorId) where.actorId = actorId;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch audit logs', error);
  }
};

const getAuditLogFilters = async (req, res) => {
  try {
    const actions = await prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
    });
    const resourceTypes = await prisma.auditLog.findMany({
      distinct: ['resourceType'],
      select: { resourceType: true },
    });

    res.json({
      success: true,
      data: {
        actions: actions.map((a) => a.action),
        resourceTypes: resourceTypes.map((r) => r.resourceType)
      }
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch audit log filters', error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogFilters
};
