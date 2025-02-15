import Subscription from "../models/subscription.model.js";
import { workflowClient } from "../config/upstash.js";
import { SERVER_URL } from "../config/env.js";

// Creates subscription
export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    const { workflowRunId } = await workflowClient.trigger({
      url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
      body: {
        subscriptionId: subscription.id,
      },
      headers: {
        "content-type": "application/json",
      },
      retries: 0,
    });

    res
      .status(201)
      .json({ success: true, data: { subscription, workflowRunId } });
  } catch (error) {
    next(error);
  }
};

// Gives all subscriptions created by a user
export const getUserSubscriptions = async (req, res, next) => {
  try {
    // check if the user is the same as the one in the token
    if (req.user.id != req.params.id) {
      const error = new Error("You are not the owner of this account");
      error.status = 401;
      throw error;
    }

    const subscriptions = await Subscription.find({ user: req.params.id });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

// Get all subscriptions
export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find();
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

// Get a single subscription by ID
export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription is not found" });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

// Update a subscription
export const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription is not found" });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

// Delete a subscription
export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription is not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Subscription deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Cancel a subscription
export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription is not found" });
    }

    subscription.status = "cancelled";
    await subscription.save();

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

// Get upcomming renewals
export const getUpcomingRenewals = async (req, res, next) => {
  try {
    const upcomingRenewals = await Subscription.find({
      nextRenewalDate: { $gte: new Date() },
    });

    res.status(200).json({ success: true, data: upcomingRenewals });
  } catch (error) {
    next(error);
  }
};
