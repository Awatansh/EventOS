import { Request, Response } from 'express';
import { EventService } from './events.service';
import {
  listEventsSchema,
  createEventSchema,
  updateEventSchema,
  uuidParamSchema,
} from './events.schema';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * Event controller — thin handlers for event CRUD.
 */
export class EventController {
  /**
   * GET /events — public listing with search, filters, pagination.
   */
  static list = asyncHandler(async (req: Request, res: Response) => {
    const params = listEventsSchema.parse(req.query);
    const result = await EventService.listEvents(params);

    res.status(200).json({
      success: true,
      data: result.events,
      meta: result.meta,
    });
  });

  /**
   * GET /events/categories — public listing of unique event categories.
   */
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await EventService.getCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  });

  /**
   * GET /events/:id — public event detail.
   */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = uuidParamSchema.parse(req.params);
    const event = await EventService.getEventById(id);

    res.status(200).json({
      success: true,
      data: event,
    });
  });

  /**
   * POST /events — admin only, create event.
   */
  static create = asyncHandler(async (req: Request, res: Response) => {
    const data = createEventSchema.parse(req.body);
    const event = await EventService.createEvent(data, req.user!.userId);

    res.status(201).json({
      success: true,
      data: event,
    });
  });

  /**
   * PATCH /events/:id — admin only, update event.
   */
  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = uuidParamSchema.parse(req.params);
    const data = updateEventSchema.parse(req.body);
    const event = await EventService.updateEvent(id, data);

    res.status(200).json({
      success: true,
      data: event,
    });
  });

  /**
   * DELETE /events/:id — admin only, soft-cancel event.
   */
  static cancel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = uuidParamSchema.parse(req.params);
    const result = await EventService.cancelEvent(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
